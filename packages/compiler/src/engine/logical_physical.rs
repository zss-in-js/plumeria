const EDGES: &[(&str, &str)] = &[
    ("margin-block-start", "margin-top"),
    ("margin-block-end", "margin-bottom"),
    ("margin-inline-start", "margin-left"),
    ("margin-inline-end", "margin-right"),
    ("padding-block-start", "padding-top"),
    ("padding-block-end", "padding-bottom"),
    ("padding-inline-start", "padding-left"),
    ("padding-inline-end", "padding-right"),
    ("scroll-margin-block-start", "scroll-margin-top"),
    ("scroll-margin-block-end", "scroll-margin-bottom"),
    ("scroll-margin-inline-start", "scroll-margin-left"),
    ("scroll-margin-inline-end", "scroll-margin-right"),
    ("scroll-padding-block-start", "scroll-padding-top"),
    ("scroll-padding-block-end", "scroll-padding-bottom"),
    ("scroll-padding-inline-start", "scroll-padding-left"),
    ("scroll-padding-inline-end", "scroll-padding-right"),
    ("inset-block-start", "top"),
    ("inset-block-end", "bottom"),
    ("inset-inline-start", "left"),
    ("inset-inline-end", "right"),
    ("border-block-start", "border-top"),
    ("border-block-end", "border-bottom"),
    ("border-inline-start", "border-left"),
    ("border-inline-end", "border-right"),
    ("border-block-start-width", "border-top-width"),
    ("border-block-start-style", "border-top-style"),
    ("border-block-start-color", "border-top-color"),
    ("border-block-end-width", "border-bottom-width"),
    ("border-block-end-style", "border-bottom-style"),
    ("border-block-end-color", "border-bottom-color"),
    ("border-inline-start-width", "border-left-width"),
    ("border-inline-start-style", "border-left-style"),
    ("border-inline-start-color", "border-left-color"),
    ("border-inline-end-width", "border-right-width"),
    ("border-inline-end-style", "border-right-style"),
    ("border-inline-end-color", "border-right-color"),
    ("border-start-start-radius", "border-top-left-radius"),
    ("border-start-end-radius", "border-top-right-radius"),
    ("border-end-start-radius", "border-bottom-left-radius"),
    ("border-end-end-radius", "border-bottom-right-radius"),
    ("corner-start-start-shape", "corner-top-left-shape"),
    ("corner-start-end-shape", "corner-top-right-shape"),
    ("corner-end-start-shape", "corner-bottom-left-shape"),
    ("corner-end-end-shape", "corner-bottom-right-shape"),
];

const AXES: &[(&str, &str)] = &[
    ("block-size", "height"),
    ("inline-size", "width"),
    ("min-block-size", "min-height"),
    ("min-inline-size", "min-width"),
    ("max-block-size", "max-height"),
    ("max-inline-size", "max-width"),
    ("overflow-block", "overflow-y"),
    ("overflow-inline", "overflow-x"),
    ("overscroll-behavior-block", "overscroll-behavior-y"),
    ("overscroll-behavior-inline", "overscroll-behavior-x"),
    ("contain-intrinsic-block-size", "contain-intrinsic-height"),
    ("contain-intrinsic-inline-size", "contain-intrinsic-width"),
];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Spelling {
    Logical,
    Physical,
}

fn pairs() -> impl Iterator<Item = &'static (&'static str, &'static str)> {
    EDGES.iter().chain(AXES.iter())
}

pub fn counterpart_of(property: &str) -> Option<&'static str> {
    pairs()
        .find(|(logical, _)| *logical == property)
        .map(|(_, physical)| *physical)
        .or_else(|| {
            pairs()
                .find(|(_, physical)| *physical == property)
                .map(|(logical, _)| *logical)
        })
}

pub fn spelling_of(property: &str, include_axes: bool) -> Option<Spelling> {
    let table: Box<dyn Iterator<Item = &(&str, &str)>> = if include_axes {
        Box::new(pairs())
    } else {
        Box::new(EDGES.iter())
    };
    for (logical, physical) in table {
        if property == *logical {
            return Some(Spelling::Logical);
        }
        if property == *physical {
            return Some(Spelling::Physical);
        }
    }
    None
}
