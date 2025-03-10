import * as Monaco from "monaco-editor";

const customTheme: Monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { background: "282828", token: "" },
    { foreground: "928374", fontStyle: "italic", token: "comment" },
    { foreground: "83a598", fontStyle: "bold", token: "keyword" },
    { foreground: "83a598", fontStyle: "bold", token: "storage" },
    { foreground: "d79921", token: "constant.numeric" },
    { foreground: "fb4934", fontStyle: "bold", token: "constant" },
    { foreground: "b16286", fontStyle: "bold", token: "constant.language" },
    { foreground: "8ec07c", token: "variable.language" },
    { foreground: "8ec07c", token: "variable.other" },
    { foreground: "b8bb26", token: "string" },
    { foreground: "d79921", token: "constant.character.escape" },
    { foreground: "d79921", token: "string source" },
    { foreground: "8ec07c", token: "meta.preprocessor" },
    { foreground: "d65d0e", fontStyle: "bold", token: "keyword.control.import" },
    { foreground: "fe8019", fontStyle: "bold", token: "entity.name.function" },
    { foreground: "fe8019", fontStyle: "bold", token: "keyword.other.name-of-parameter.objc" },
    { fontStyle: "underline", token: "entity.name.type" },
    { fontStyle: "italic", token: "entity.other.inherited-class" },
    { fontStyle: "italic", token: "variable.parameter" },
    { foreground: "b8bb26", token: "storage.type.method" },
    { fontStyle: "italic", token: "meta.section entity.name.section" },
    { fontStyle: "italic", token: "declaration.section entity.name.section" },
    { foreground: "8ec07c", fontStyle: "bold", token: "support.function" },
    { foreground: "b16286", fontStyle: "bold", token: "support.class" },
    { foreground: "b16286", fontStyle: "bold", token: "support.type" },
    { foreground: "d79921", fontStyle: "bold", token: "support.constant" },
    { foreground: "83a598", fontStyle: "bold", token: "support.variable" },
    { foreground: "fb4934", token: "keyword.operator.js" },
    { foreground: "ffffff", background: "9d0006", token: "invalid" },
    { background: "7c6f64", token: "invalid.deprecated.trailing-whitespace" },
    { background: "3c3836", token: "text source" },
    { background: "3c3836", token: "string.unquoted" },
    { foreground: "928374", token: "meta.tag.preprocessor.xml" },
    { foreground: "928374", token: "meta.tag.sgml.doctype" },
    { fontStyle: "italic", token: "string.quoted.docinfo.doctype.DTD" },
    { foreground: "83a598", token: "meta.tag" },
    { foreground: "83a598", token: "declaration.tag" },
    { fontStyle: "bold", token: "entity.name.tag" },
    { fontStyle: "italic", token: "entity.other.attribute-name" }
  ],
  colors: {
    "editor.foreground": "#c8c8c8",
    "editor.background": "#282828",
    "editor.selectionBackground": "#504945",
    "editor.lineHighlightBackground": "#1E1E1E",
    "editorCursor.foreground": "#ebdbb2",
    "editorWhitespace.foreground": "#BFBFBF",
    "minimap.background": "#282828",
    "editorLineNumber.foreground": "#282828"
  }
};

export default customTheme;
