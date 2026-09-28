use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_parser::{ParseOptions, Parser};
use oxc_span::SourceType;

fn options() -> ParseOptions {
    ParseOptions {
        preserve_parens: true,
        ..ParseOptions::default()
    }
}

pub fn parse_program<'a>(allocator: &'a Allocator, source: &'a str) -> Result<Program<'a>, String> {
    let ret = Parser::new(allocator, source, SourceType::tsx())
        .with_options(options())
        .parse();
    if ret.panicked || !ret.diagnostics.is_empty() {
        let message = ret
            .diagnostics
            .first()
            .map(|diagnostic| diagnostic.to_string())
            .unwrap_or_else(|| "Syntax error".to_string());
        return Err(message);
    }
    Ok(ret.program)
}

pub fn parse_expression_text<'a>(
    allocator: &'a Allocator,
    text: &str,
) -> Option<&'a Expression<'a>> {
    let text = allocator.alloc_str(text);
    let expr = Parser::new(allocator, text, SourceType::tsx())
        .with_options(options())
        .parse_expression()
        .ok()?;
    Some(allocator.alloc(expr))
}

pub fn parse_object_text<'a>(
    allocator: &'a Allocator,
    text: &str,
) -> Option<&'a ObjectExpression<'a>> {
    match parse_expression_text(allocator, text)? {
        Expression::ObjectExpression(object) => Some(object),
        _ => None,
    }
}
