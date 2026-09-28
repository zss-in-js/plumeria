use oxc_ast::ast::*;
use oxc_span::{GetSpan, Span};
use oxc_syntax::operator::{BinaryOperator, LogicalOperator};

#[derive(Clone, Copy)]
pub struct E<'b, 'a> {
    node: Node<'b, 'a>,
    deep: bool,
}

#[derive(Clone, Copy)]
enum Node<'b, 'a> {
    Expr(&'b Expression<'a>),
    Chain(&'b ChainElement<'a>),
    Member(Member<'b, 'a>),
    Call(&'b CallExpression<'a>),
}

#[derive(Clone, Copy)]
pub enum Member<'b, 'a> {
    Static(&'b StaticMemberExpression<'a>),
    Computed(&'b ComputedMemberExpression<'a>),
    Private(&'b PrivateFieldExpression<'a>),
}

#[derive(Clone, Copy)]
pub enum Prop<'b, 'a> {
    Name(&'b str),
    Computed(E<'b, 'a>),
    Private,
}

#[derive(Clone, Copy)]
pub enum BinOp {
    Logical(LogicalOperator),
    Binary(BinaryOperator),
}

impl BinOp {
    pub fn is_and(self) -> bool {
        matches!(self, BinOp::Logical(LogicalOperator::And))
    }
}

#[derive(Clone, Copy)]
pub enum K<'b, 'a> {
    Str(&'b StringLiteral<'a>),
    Num(&'b NumericLiteral<'a>),
    Bool(bool),
    Null,
    Template(&'b TemplateLiteral<'a>),
    Ident(&'b IdentifierReference<'a>),
    Member(Member<'b, 'a>),
    Call(&'b CallExpression<'a>),
    Object(&'b ObjectExpression<'a>),
    Array(&'b ArrayExpression<'a>),
    Conditional(&'b ConditionalExpression<'a>),
    Binary(E<'b, 'a>, BinOp, E<'b, 'a>),
    Unary(&'b UnaryExpression<'a>),
    Paren(&'b ParenthesizedExpression<'a>),
    Arrow,
    Function,
    Wrapper(E<'b, 'a>),
    Chain(&'b ChainExpression<'a>),
    Other,
}

impl<'b, 'a> E<'b, 'a> {
    pub fn new(expr: &'b Expression<'a>) -> Self {
        E {
            node: Node::Expr(expr),
            deep: false,
        }
    }

    pub fn from_member(member: Member<'b, 'a>) -> Self {
        E {
            node: Node::Member(member),
            deep: false,
        }
    }

    pub fn from_call(call: &'b CallExpression<'a>) -> Self {
        E {
            node: Node::Call(call),
            deep: false,
        }
    }

    pub fn expr(&self) -> Option<&'b Expression<'a>> {
        match self.node {
            Node::Expr(expr) => Some(expr),
            _ => None,
        }
    }

    pub fn span(&self) -> Span {
        match self.node {
            Node::Expr(expr) => expr.span(),
            Node::Chain(chain) => chain.span(),
            Node::Member(member) => member_span(member),
            Node::Call(call) => call.span,
        }
    }

    pub fn start(&self) -> u32 {
        self.span().start
    }

    pub fn kind(&self) -> K<'b, 'a> {
        let child = |expr: &'b Expression<'a>| E {
            node: Node::Expr(expr),
            deep: false,
        };
        match self.node {
            Node::Member(member) => K::Member(member),
            Node::Call(call) => K::Call(call),
            Node::Chain(chain) => match chain {
                ChainElement::CallExpression(call) => K::Call(call),
                ChainElement::TSNonNullExpression(inner) => K::Wrapper(child(&inner.expression)),
                ChainElement::StaticMemberExpression(member) => K::Member(Member::Static(member)),
                ChainElement::ComputedMemberExpression(member) => {
                    K::Member(Member::Computed(member))
                }
                ChainElement::PrivateFieldExpression(member) => K::Member(Member::Private(member)),
            },
            Node::Expr(expr) => match expr {
                Expression::StringLiteral(value) => K::Str(value),
                Expression::NumericLiteral(value) => K::Num(value),
                Expression::BooleanLiteral(value) => K::Bool(value.value),
                Expression::NullLiteral(_) => K::Null,
                Expression::TemplateLiteral(value) => K::Template(value),
                Expression::Identifier(ident) => K::Ident(ident),
                Expression::StaticMemberExpression(member) => K::Member(Member::Static(member)),
                Expression::ComputedMemberExpression(member) => K::Member(Member::Computed(member)),
                Expression::PrivateFieldExpression(member) => K::Member(Member::Private(member)),
                Expression::CallExpression(call) => K::Call(call),
                Expression::ObjectExpression(object) => K::Object(object),
                Expression::ArrayExpression(array) => K::Array(array),
                Expression::ConditionalExpression(cond) => K::Conditional(cond),
                Expression::LogicalExpression(logical) => K::Binary(
                    child(&logical.left),
                    BinOp::Logical(logical.operator),
                    child(&logical.right),
                ),
                Expression::BinaryExpression(binary) => K::Binary(
                    child(&binary.left),
                    BinOp::Binary(binary.operator),
                    child(&binary.right),
                ),
                Expression::UnaryExpression(unary) => K::Unary(unary),
                Expression::ParenthesizedExpression(paren) => K::Paren(paren),
                Expression::ArrowFunctionExpression(_) => K::Arrow,
                Expression::FunctionExpression(_) => K::Function,
                Expression::TSAsExpression(inner) => K::Wrapper(child(&inner.expression)),
                Expression::TSSatisfiesExpression(inner) => K::Wrapper(child(&inner.expression)),
                Expression::TSNonNullExpression(inner) => K::Wrapper(child(&inner.expression)),
                Expression::TSTypeAssertion(inner) => K::Wrapper(child(&inner.expression)),
                Expression::ChainExpression(chain) => K::Chain(chain),
                _ => K::Other,
            },
        }
    }

    pub fn member_object(&self, member: Member<'b, 'a>) -> E<'b, 'a> {
        let object = match member {
            Member::Static(m) => &m.object,
            Member::Computed(m) => &m.object,
            Member::Private(m) => &m.object,
        };
        let raw = E::new(object);
        if self.deep { unwrap(raw) } else { raw }
    }

    pub fn is_ident(&self) -> bool {
        matches!(self.kind(), K::Ident(_))
    }

    pub fn ident(&self) -> Option<&'b IdentifierReference<'a>> {
        match self.kind() {
            K::Ident(ident) => Some(ident),
            _ => None,
        }
    }

    pub fn ident_name(&self) -> Option<&'b str> {
        self.ident().map(|ident| ident.name.as_str())
    }

    pub fn is_member(&self) -> bool {
        matches!(self.kind(), K::Member(_))
    }

    pub fn member(&self) -> Option<Member<'b, 'a>> {
        match self.kind() {
            K::Member(member) => Some(member),
            _ => None,
        }
    }

    pub fn object(&self) -> Option<E<'b, 'a>> {
        self.member().map(|member| self.member_object(member))
    }

    pub fn prop(&self) -> Option<Prop<'b, 'a>> {
        self.member().map(|member| member_prop(member))
    }

    pub fn call(&self) -> Option<&'b CallExpression<'a>> {
        match self.kind() {
            K::Call(call) => Some(call),
            _ => None,
        }
    }

    pub fn object_expr(&self) -> Option<&'b ObjectExpression<'a>> {
        match self.kind() {
            K::Object(object) => Some(object),
            _ => None,
        }
    }

    pub fn is_undefined_ident(&self) -> bool {
        self.ident_name() == Some("undefined")
    }

    pub fn is_no_op_style(&self) -> bool {
        matches!(self.kind(), K::Null | K::Bool(false)) || self.is_undefined_ident()
    }
}

pub fn member_prop<'b, 'a>(member: Member<'b, 'a>) -> Prop<'b, 'a> {
    match member {
        Member::Static(m) => Prop::Name(m.property.name.as_str()),
        Member::Computed(m) => Prop::Computed(E::new(&m.expression)),
        Member::Private(_) => Prop::Private,
    }
}

pub fn member_span(member: Member) -> Span {
    match member {
        Member::Static(m) => m.span,
        Member::Computed(m) => m.span,
        Member::Private(m) => m.span,
    }
}

pub fn unwrap<'b, 'a>(e: E<'b, 'a>) -> E<'b, 'a> {
    let mut current = e;
    loop {
        match current.kind() {
            K::Paren(paren) => current = E::new(&paren.expression),
            K::Wrapper(inner) => current = inner,
            K::Chain(chain) => {
                current = E {
                    node: Node::Chain(&chain.expression),
                    deep: false,
                };
                continue;
            }
            K::Member(_) => {
                return E {
                    node: current.node,
                    deep: true,
                };
            }
            _ => return current,
        }
    }
}

pub fn unwrap_style<'b, 'a>(e: E<'b, 'a>) -> E<'b, 'a> {
    let mut current = e;
    loop {
        match current.kind() {
            K::Paren(paren) => current = E::new(&paren.expression),
            K::Wrapper(inner) => current = inner,
            _ => return current,
        }
    }
}

pub fn root_identifier<'b, 'a>(e: E<'b, 'a>) -> Option<&'b str> {
    let e = unwrap(e);
    match e.kind() {
        K::Ident(ident) => Some(ident.name.as_str()),
        K::Member(member) => root_identifier(e.member_object(member)),
        K::Call(call) => match &call.callee {
            Expression::Super(_) => None,
            callee => root_identifier(E::new(callee)),
        },
        _ => None,
    }
}

pub fn expression_label(e: E) -> String {
    let e = unwrap(e);
    match e.kind() {
        K::Ident(ident) => ident.name.to_string(),
        K::Str(value) => format!("'{}'", value.value),
        K::Num(value) => crate::js::number::number_to_string(value.value),
        K::Member(member) => {
            let object = expression_label(e.member_object(member));
            match member_prop(member) {
                Prop::Name(name) => format!("{object}.{name}"),
                Prop::Computed(inner) => format!("{object}[{}]", expression_label(inner)),
                Prop::Private => "an expression".to_string(),
            }
        }
        K::Null => "null".to_string(),
        K::Object(_) => "an object literal".to_string(),
        K::Array(_) => "an array literal".to_string(),
        K::Call(_) => "a function call".to_string(),
        K::Conditional(_) => "a conditional expression".to_string(),
        K::Arrow | K::Function => "a function".to_string(),
        _ => match e.expr() {
            Some(Expression::NewExpression(_)) => "a new expression".to_string(),
            Some(Expression::TaggedTemplateExpression(_)) => "a tagged template".to_string(),
            Some(Expression::AwaitExpression(_)) => "an await expression".to_string(),
            _ => "an expression".to_string(),
        },
    }
}

pub fn swc_type_name(expr: &Expression) -> &'static str {
    match expr {
        Expression::BooleanLiteral(_) => "BooleanLiteral",
        Expression::NullLiteral(_) => "NullLiteral",
        Expression::NumericLiteral(_) => "NumericLiteral",
        Expression::BigIntLiteral(_) => "BigIntLiteral",
        Expression::RegExpLiteral(_) => "RegExpLiteral",
        Expression::StringLiteral(_) => "StringLiteral",
        Expression::TemplateLiteral(_) => "TemplateLiteral",
        Expression::Identifier(_) => "Identifier",
        Expression::Super(_) => "Super",
        Expression::ArrayExpression(_) => "ArrayExpression",
        Expression::ArrowFunctionExpression(_) => "ArrowFunctionExpression",
        Expression::AssignmentExpression(_) => "AssignmentExpression",
        Expression::AwaitExpression(_) => "AwaitExpression",
        Expression::BinaryExpression(_) | Expression::LogicalExpression(_) => "BinaryExpression",
        Expression::CallExpression(_) => "CallExpression",
        Expression::ChainExpression(_) => "OptionalChainingExpression",
        Expression::ClassExpression(_) => "ClassExpression",
        Expression::ConditionalExpression(_) => "ConditionalExpression",
        Expression::FunctionExpression(_) => "FunctionExpression",
        Expression::ImportExpression(_) => "CallExpression",
        Expression::NewExpression(_) => "NewExpression",
        Expression::ObjectExpression(_) => "ObjectExpression",
        Expression::ParenthesizedExpression(_) => "ParenthesisExpression",
        Expression::SequenceExpression(_) => "SequenceExpression",
        Expression::TaggedTemplateExpression(_) => "TaggedTemplateExpression",
        Expression::ThisExpression(_) => "ThisExpression",
        Expression::UnaryExpression(_) => "UnaryExpression",
        Expression::UpdateExpression(_) => "UpdateExpression",
        Expression::YieldExpression(_) => "YieldExpression",
        Expression::JSXElement(_) => "JSXElement",
        Expression::JSXFragment(_) => "JSXFragment",
        Expression::TSAsExpression(_) => "TsAsExpression",
        Expression::TSSatisfiesExpression(_) => "TsSatisfiesExpression",
        Expression::TSTypeAssertion(_) => "TsTypeAssertion",
        Expression::TSNonNullExpression(_) => "TsNonNullExpression",
        Expression::TSInstantiationExpression(_) => "TsInstantiation",
        Expression::StaticMemberExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::PrivateFieldExpression(_) => "MemberExpression",
        _ => "Expression",
    }
}
