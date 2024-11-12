// Language.ts
export abstract class Language {
    constructor(public name: string, public value: string) {}
    abstract getDescription(): string;
  }

  export class Python extends Language {
    constructor() {
      super("Python", "python");
    }

    getDescription(): string {
      return "Python is a high-level, interpreted programming language.";
    }
  }

  export class Java extends Language {
    constructor() {
      super("Java", "java");
    }

    getDescription(): string {
      return "Java is a high-level, class-based, object-oriented programming language.";
    }
  }

  export class JavaScript extends Language {
    constructor() {
      super("JavaScript", "javascript");
    }

    getDescription(): string {
      return "JavaScript is a high-level, just-in-time compiled, multi-paradigm programming language.";
    }
  }

  export class Cpp extends Language {
    constructor() {
      super("C++", "cpp");
    }

    getDescription(): string {
      return "C++ is a general-purpose programming language created as an extension of the C programming language.";
    }
  }

  export class CSharp extends Language {
    constructor() {
      super("C#", "csharp");
    }

    getDescription(): string {
      return "C# is a modern, object-oriented programming language developed by Microsoft.";
    }
  }
