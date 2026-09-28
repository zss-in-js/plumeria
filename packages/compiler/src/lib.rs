mod compile;
mod engine;
mod eval;
mod filter;
mod fs;
mod js;
mod optimize;
mod policy;
mod project;
mod style;
mod syntax;
mod transform;

use napi::bindgen_prelude::{Either, Function, Undefined};
use napi::{Env, Error, Result, Status};
use napi_derive::napi;

use crate::engine::logical_physical::Spelling;
use crate::policy::{PolicyOption, PropertyPolicy};
use crate::project::lock_project;

#[napi]
pub const DEFAULT_STYLE_PROP: &str = project::DEFAULT_STYLE_PROP;

fn failure(message: String) -> Error {
    Error::new(Status::GenericFailure, message)
}

fn compilation_error(env: &Env, message: String) -> Error {
    let thrown = env
        .create_error(failure(message.clone()))
        .and_then(|mut error| {
            error.set("stack", message.as_str())?;
            env.throw(error)
        });
    match thrown {
        Ok(()) => Error::new(Status::PendingException, String::new()),
        Err(error) => error,
    }
}

fn current_dir(cwd: Option<String>) -> Result<String> {
    match cwd {
        Some(cwd) => Ok(cwd),
        None => std::env::current_dir()
            .map(|dir| dir.to_string_lossy().into_owned())
            .map_err(|error| failure(error.to_string())),
    }
}

#[napi(object)]
pub struct SizesOption {
    pub sizes: Option<bool>,
}

fn policy_option(option: Option<Either<bool, SizesOption>>) -> PolicyOption {
    match option {
        Some(Either::A(enabled)) => PolicyOption {
            enabled,
            sizes: false,
        },
        Some(Either::B(object)) => PolicyOption {
            enabled: true,
            sizes: object.sizes.unwrap_or(false),
        },
        None => PolicyOption::default(),
    }
}

#[napi(object)]
pub struct PropertyPolicyOptions {
    pub without_logical_properties: Option<Either<bool, SizesOption>>,
    pub without_physical_properties: Option<Either<bool, SizesOption>>,
}

#[napi(object)]
pub struct PropertyPolicyValue {
    pub reject: String,
    pub include_axes: bool,
}

fn to_policy(value: Option<PropertyPolicyValue>) -> Option<PropertyPolicy> {
    value.map(|value| PropertyPolicy {
        reject: if value.reject == "logical" {
            Spelling::Logical
        } else {
            Spelling::Physical
        },
        include_axes: value.include_axes,
    })
}

#[napi(js_name = "resolvePropertyPolicy")]
pub fn resolve_property_policy(
    options: Option<PropertyPolicyOptions>,
) -> Result<Either<PropertyPolicyValue, Undefined>> {
    let options = options.unwrap_or(PropertyPolicyOptions {
        without_logical_properties: None,
        without_physical_properties: None,
    });
    let policy = policy::resolve_property_policy(
        policy_option(options.without_logical_properties),
        policy_option(options.without_physical_properties),
    )
    .map_err(failure)?;
    Ok(match policy {
        Some(policy) => Either::A(PropertyPolicyValue {
            reject: match policy.reject {
                Spelling::Logical => "logical".to_string(),
                Spelling::Physical => "physical".to_string(),
            },
            include_axes: policy.include_axes,
        }),
        None => Either::B(()),
    })
}

#[napi(js_name = "needsCompile")]
pub fn needs_compile(source: String, style_prop: String, file_path: String) -> bool {
    filter::needs_compile(&source, &style_prop, &file_path)
}

#[napi(object, object_to_js = false)]
pub struct TransformEnv<'scope> {
    pub source: String,
    pub module_id: String,
    pub file_path: String,
    pub root: String,
    pub style_prop: Option<String>,
    pub class_prop: Option<String>,
    pub property_policy: Option<PropertyPolicyValue>,
    pub is_dev: bool,
    pub collect_ondemand_sheets: bool,
    pub cwd: Option<String>,
    pub add_dependency: Option<Function<'scope, String, ()>>,
}

#[napi(object)]
pub struct TransformOutput {
    pub code: String,
    pub sheets: Vec<String>,
    pub dependencies: Vec<String>,
}

#[napi(js_name = "transformSource")]
pub fn transform_source(env: Env, options: TransformEnv) -> Result<TransformOutput> {
    let cwd = current_dir(options.cwd)?;
    let transform_env = transform::TransformEnv {
        source: options.source,
        module_id: options.module_id,
        file_path: options.file_path,
        root: options.root,
        style_prop: options
            .style_prop
            .unwrap_or_else(|| DEFAULT_STYLE_PROP.to_string()),
        class_prop: options
            .class_prop
            .unwrap_or_else(|| "className".to_string()),
        policy: to_policy(options.property_policy),
        is_dev: options.is_dev,
        collect_ondemand_sheets: options.collect_ondemand_sheets,
        cwd,
    };
    let output = {
        let mut project = lock_project();
        transform::transform_source(&mut project, &transform_env)
            .map_err(|message| compilation_error(&env, message))?
    };
    if let Some(add_dependency) = &options.add_dependency {
        for dependency in &output.dependencies {
            add_dependency.call(dependency.clone())?;
        }
    }
    Ok(TransformOutput {
        code: output.code,
        sheets: output.sheets,
        dependencies: output.dependencies,
    })
}

#[napi(object)]
pub struct CompilerOptions {
    pub include: Vec<String>,
    pub exclude: Vec<String>,
    pub cwd: Option<String>,
    pub style_prop: Option<String>,
    pub without_logical_properties: Option<Either<bool, SizesOption>>,
    pub without_physical_properties: Option<Either<bool, SizesOption>>,
}

#[napi(js_name = "compileCSS")]
pub fn compile_css(options: CompilerOptions) -> Result<String> {
    let policy = policy::resolve_property_policy(
        policy_option(options.without_logical_properties),
        policy_option(options.without_physical_properties),
    )
    .map_err(failure)?;
    let cwd = current_dir(options.cwd)?;
    let compile_options = compile::CompileOptions {
        include: options.include,
        exclude: options.exclude,
        cwd,
        style_prop: options
            .style_prop
            .unwrap_or_else(|| DEFAULT_STYLE_PROP.to_string()),
        policy,
    };
    let mut project = lock_project();
    compile::compile_css(&mut project, &compile_options).map_err(failure)
}

#[napi]
pub fn optimizer(css_code: String) -> Result<String> {
    let minify = std::env::var("NODE_ENV").is_ok_and(|mode| mode == "production");
    optimize::optimize(&css_code, minify).map_err(failure)
}

#[napi(object)]
pub struct PropEntry {
    pub key: String,
}

#[napi(object)]
pub struct ScanSummary {
    pub create_hash_table: std::collections::HashMap<String, String>,
    pub component_props_table:
        std::collections::HashMap<String, std::collections::HashMap<String, Vec<PropEntry>>>,
}

#[napi(js_name = "scanAll")]
pub fn scan_all(cwd: Option<String>, style_prop: Option<String>) -> Result<ScanSummary> {
    let cwd = current_dir(cwd)?;
    let mut project = lock_project();
    project.scan_all(&cwd, style_prop.as_deref().unwrap_or(DEFAULT_STYLE_PROP));
    let create_hash_table = project
        .tables
        .create_hash
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    let component_props_table = project
        .tables
        .component_props
        .iter()
        .map(|(comp_key, props)| {
            (
                comp_key.clone(),
                props
                    .iter()
                    .map(|(prop, entries)| {
                        (
                            prop.clone(),
                            entries
                                .iter()
                                .map(|entry| PropEntry {
                                    key: entry.key.clone(),
                                })
                                .collect(),
                        )
                    })
                    .collect(),
            )
        })
        .collect();
    Ok(ScanSummary {
        create_hash_table,
        component_props_table,
    })
}

#[napi(js_name = "resolveImportPath")]
pub fn resolve_import_path(import_path: String, importer: String) -> Option<String> {
    lock_project().resolve_import_path(&import_path, &importer)
}

#[napi(object)]
pub struct ExportSite {
    pub file_path: String,
    pub local_name: String,
}

#[napi(js_name = "resolveExport")]
pub fn resolve_export(file_path: String, export_name: String) -> Option<ExportSite> {
    lock_project()
        .resolve_export(&file_path, &export_name)
        .map(|site| ExportSite {
            file_path: site.file,
            local_name: site.local_name,
        })
}

fn to_json(value: &js::Value) -> serde_json::Value {
    match value {
        js::Value::Str(text) => serde_json::Value::String(text.clone()),
        js::Value::Num(number) => serde_json::Number::from_f64(*number)
            .map(serde_json::Value::Number)
            .unwrap_or(serde_json::Value::Null),
        js::Value::Bool(flag) => serde_json::Value::Bool(*flag),
        js::Value::Null => serde_json::Value::Null,
        js::Value::Obj(object) => serde_json::Value::Object(
            object
                .iter()
                .map(|(key, value)| (key.to_string(), to_json(value)))
                .collect(),
        ),
    }
}

#[napi(js_name = "resolveExportValue")]
pub fn resolve_export_value(
    file_path: String,
    export_name: String,
) -> Either<serde_json::Value, Undefined> {
    match lock_project().resolve_export_value(&file_path, &export_name) {
        Some(value) => Either::A(to_json(&value)),
        None => Either::B(()),
    }
}

fn from_json(value: &serde_json::Value) -> js::Value {
    match value {
        serde_json::Value::String(text) => js::Value::Str(text.clone()),
        serde_json::Value::Number(number) => js::Value::Num(number.as_f64().unwrap_or(f64::NAN)),
        serde_json::Value::Bool(flag) => js::Value::Bool(*flag),
        serde_json::Value::Null | serde_json::Value::Array(_) => js::Value::Null,
        serde_json::Value::Object(_) => {
            js::Value::Obj(std::sync::Arc::new(object_from_json(value)))
        }
    }
}

fn object_from_json(value: &serde_json::Value) -> js::Object {
    let mut object = js::Object::new();
    if let serde_json::Value::Object(entries) = value {
        for (key, value) in entries {
            object.insert(key.as_str(), from_json(value));
        }
    }
    object
}

#[napi(object)]
pub struct StyleRecordOutput {
    pub key: String,
    pub hash: String,
    pub sheet: String,
}

#[napi(js_name = "getStyleRecords")]
pub fn get_style_records(
    style_rule: serde_json::Value,
    weights: Option<std::collections::HashMap<String, i64>>,
) -> Vec<StyleRecordOutput> {
    let weights = weights.map(|weights| weights.into_iter().collect::<style::records::Weights>());
    style::records::style_records(&object_from_json(&style_rule), weights.as_ref())
        .into_iter()
        .map(|record| StyleRecordOutput {
            key: record.key,
            hash: record.hash,
            sheet: record.sheet,
        })
        .collect()
}

#[napi(js_name = "themeHashOf")]
pub fn theme_hash_of(theme_selector: String, rule: serde_json::Value) -> String {
    style::theme::theme_hash_of(&theme_selector, &object_from_json(&rule))
}

#[napi(js_name = "createTheme")]
pub fn create_theme(
    theme_selector: String,
    rule: serde_json::Value,
    theme_hash: String,
) -> serde_json::Value {
    to_json(&js::Value::Obj(std::sync::Arc::new(
        style::theme::create_theme(&theme_selector, &object_from_json(&rule), &theme_hash),
    )))
}
