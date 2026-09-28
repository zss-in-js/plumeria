use oxc_ast::ast::*;
use oxc_ast_visit::{Visit, walk};

pub struct AnyIdentifier<'f> {
    pub test: &'f dyn Fn(&str) -> bool,
    pub found: bool,
}

impl<'a> Visit<'a> for AnyIdentifier<'_> {
    fn visit_identifier_reference(&mut self, it: &IdentifierReference<'a>) {
        if !self.found && (self.test)(it.name.as_str()) {
            self.found = true;
        }
    }

    fn visit_identifier_name(&mut self, it: &IdentifierName<'a>) {
        if !self.found && (self.test)(it.name.as_str()) {
            self.found = true;
        }
    }

    fn visit_binding_identifier(&mut self, it: &BindingIdentifier<'a>) {
        if !self.found && (self.test)(it.name.as_str()) {
            self.found = true;
        }
    }

    fn visit_label_identifier(&mut self, it: &LabelIdentifier<'a>) {
        if !self.found && (self.test)(it.name.as_str()) {
            self.found = true;
        }
    }

    fn visit_jsx_identifier(&mut self, it: &JSXIdentifier<'a>) {
        if !self.found && (self.test)(it.name.as_str()) {
            self.found = true;
        }
    }
}

pub fn expression_has_identifier(expr: &Expression, test: &dyn Fn(&str) -> bool) -> bool {
    let mut visitor = AnyIdentifier { test, found: false };
    visitor.visit_expression(expr);
    visitor.found
}

pub struct ReadsNames<'f> {
    pub names: &'f dyn Fn(&str) -> bool,
    pub found: bool,
}

impl<'a> Visit<'a> for ReadsNames<'_> {
    fn visit_identifier_reference(&mut self, it: &IdentifierReference<'a>) {
        if (self.names)(it.name.as_str()) {
            self.found = true;
        }
    }

    fn visit_binding_identifier(&mut self, it: &BindingIdentifier<'a>) {
        if (self.names)(it.name.as_str()) {
            self.found = true;
        }
    }

    fn visit_object_property(&mut self, it: &ObjectProperty<'a>) {
        if it.shorthand {
            if (self.names)(match &it.key {
                PropertyKey::StaticIdentifier(ident) => ident.name.as_str(),
                _ => "",
            }) {
                self.found = true;
            }
            return;
        }
        self.visit_expression(&it.value);
    }

    fn visit_static_member_expression(&mut self, it: &StaticMemberExpression<'a>) {
        self.visit_expression(&it.object);
    }

    fn visit_ts_type_annotation(&mut self, _it: &TSTypeAnnotation<'a>) {}

    fn visit_ts_type_parameter_instantiation(&mut self, _it: &TSTypeParameterInstantiation<'a>) {}

    fn visit_ts_type_parameter_declaration(&mut self, _it: &TSTypeParameterDeclaration<'a>) {}
}

pub fn reads_names_expr(expr: &Expression, names: &dyn Fn(&str) -> bool) -> bool {
    let mut visitor = ReadsNames {
        names,
        found: false,
    };
    visitor.visit_expression(expr);
    visitor.found
}

pub fn reads_names_property(prop: &ObjectPropertyKind, names: &dyn Fn(&str) -> bool) -> bool {
    let mut visitor = ReadsNames {
        names,
        found: false,
    };
    match prop {
        ObjectPropertyKind::ObjectProperty(prop) => visitor.visit_object_property(prop),
        ObjectPropertyKind::SpreadProperty(spread) => visitor.visit_expression(&spread.argument),
    }
    visitor.found
}

pub fn jsx_openings<'b, 'a>(program: &'b Program<'a>) -> Vec<&'b JSXOpeningElement<'a>> {
    struct Collect<'b, 'a> {
        found: Vec<*const JSXOpeningElement<'a>>,
        _marker: std::marker::PhantomData<&'b ()>,
    }
    impl<'b, 'a> Visit<'a> for Collect<'b, 'a> {
        fn visit_jsx_opening_element(&mut self, it: &JSXOpeningElement<'a>) {
            self.found.push(it as *const _);
            walk::walk_jsx_opening_element(self, it);
        }
    }
    let mut collect = Collect {
        found: Vec::new(),
        _marker: std::marker::PhantomData,
    };
    collect.visit_program(program);
    collect
        .found
        .into_iter()
        .map(|ptr| unsafe { &*ptr })
        .collect()
}
