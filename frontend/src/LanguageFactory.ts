// LanguageFactory.ts
export interface Language {
  name: string;
  value: string;
  getDescription(): string;
}

export class Python implements Language {
  name = "Python";
  value = "python";
  getDescription(): string {
    return "Python is a high-level, interpreted programming language.";
  }
}

export class Java implements Language {
  name = "Java";
  value = "java";
  getDescription(): string {
    return "Java is a high-level, class-based, object-oriented programming language.";
  }
}

export class JavaScript implements Language {
  name = "JavaScript";
  value = "javascript";
  getDescription(): string {
    return "JavaScript is a high-level, just-in-time compiled, multi-paradigm programming language.";
  }
}

export class Cpp implements Language {
  name = "C++";
  value = "cpp";
  getDescription(): string {
    return "C++ is a general-purpose programming language created as an extension of the C programming language.";
  }
}

export class CSharp implements Language {
  name = "C#";
  value = "csharp";
  getDescription(): string {
    return "C# is a modern, object-oriented programming language developed by Microsoft.";
  }
}

export class LanguageFactory {
  public static createLanguage(type: string): Language | null {
    switch (type) {
      case "python":
        return new Python();
      case "java":
        return new Java();
      case "javascript":
        return new JavaScript();
      case "cpp":
        return new Cpp();
      case "csharp":
        return new CSharp();
      default:
        return null;
    }
  }

  public static getLanguages(): Language[] {
    return [
      new Python(),
      new Java(),
      new JavaScript(),
      new Cpp(),
      new CSharp()
    ];
  }
}
