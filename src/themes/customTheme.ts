import * as Monaco from "monaco-editor";

const customTheme: Monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    // Base background for default text
    { background: "1a1a1a", token: "" },
    // Comments in a soft gray italic
    { foreground: "707070", fontStyle: "italic", token: "comment" },
    // Keywords & storage in a pastel purple
    { foreground: "c792ea", fontStyle: "bold", token: "keyword" },
    { foreground: "c792ea", fontStyle: "bold", token: "storage" },
    // Numeric constants in a warm orange
    { foreground: "f78c6c", token: "constant.numeric" },
    { foreground: "f78c6c", fontStyle: "bold", token: "constant" },
    { foreground: "f78c6c", fontStyle: "bold", token: "constant.language" },
    // Variables in a cool cyan
    { foreground: "89ddff", token: "variable.language" },
    { foreground: "89ddff", token: "variable.other" },
    // Strings in a soft green
    { foreground: "c3e88d", token: "string" },
    { foreground: "c3e88d", token: "constant.character.escape" },
    { foreground: "c3e88d", token: "string source" },
    // Preprocessor and imports in a bright blue
    { foreground: "82aaff", token: "meta.preprocessor" },
    { foreground: "82aaff", fontStyle: "bold", token: "keyword.control.import" },
    // Functions in bright blue bold
    { foreground: "82aaff", fontStyle: "bold", token: "entity.name.function" },
    { foreground: "82aaff", fontStyle: "bold", token: "keyword.other.name-of-parameter.objc" },
    { fontStyle: "underline", token: "entity.name.type" },
    { fontStyle: "italic", token: "entity.other.inherited-class" },
    { fontStyle: "italic", token: "variable.parameter" },
    { foreground: "82aaff", token: "storage.type.method" },
    { fontStyle: "italic", token: "meta.section entity.name.section" },
    { fontStyle: "italic", token: "declaration.section entity.name.section" },
    // Support types and functions
    { foreground: "82aaff", fontStyle: "bold", token: "support.function" },
    { foreground: "82aaff", fontStyle: "bold", token: "support.class" },
    { foreground: "82aaff", fontStyle: "bold", token: "support.type" },
    { foreground: "f78c6c", fontStyle: "bold", token: "support.constant" },
    { foreground: "e0e0e0", fontStyle: "bold", token: "support.variable" },
    { foreground: "c792ea", token: "keyword.operator.js" },
    // Invalid tokens: highlight with a vivid red background
    { foreground: "ffffff", background: "ff5555", token: "invalid" },
    { background: "3e3e3e", token: "invalid.deprecated.trailing-whitespace" },
    // HTML/XML and similar
    { background: "1a1a1a", token: "text source" },
    { background: "1a1a1a", token: "string.unquoted" },
    { foreground: "707070", token: "meta.tag.preprocessor.xml" },
    { foreground: "707070", token: "meta.tag.sgml.doctype" },
    { fontStyle: "italic", token: "string.quoted.docinfo.doctype.DTD" },
    { foreground: "e0e0e0", token: "meta.tag" },
    { foreground: "e0e0e0", token: "declaration.tag" },
    { fontStyle: "bold", token: "entity.name.tag" },
    { fontStyle: "italic", token: "entity.other.attribute-name" }
  ],
  colors: {
    "editor.foreground": "#e0e0e0",                // Light text
    "editor.background": "#1a1a1ab3",                // Dark background to match your app
    "editor.selectionBackground": "#44444480",     // Semi-transparent selection
    "editor.lineHighlightBackground": "#33333380", // Highlighted line background
    "editorCursor.foreground": "#ffffff",          // Bright white cursor
    "editorWhitespace.foreground": "#3a3a3a",        // Dimmer whitespace guides
    "minimap.background": "#1a1a1a",               // Minimap background
    "editorLineNumber.foreground": "#707070"       // Line numbers in soft gray
  }
};

export default customTheme;
