import { mod, type Domain } from "./types";

export const c: Domain = {
  id: "c",
  name: "C programming",
  description: "From your first program to pointers, memory and a final project",
  group: "Programming languages",
  modules: [
    // ---------- Beginner ----------
    mod(
      "c-basics",
      "C: getting started",
      "beginner",
      [
        "What C is and how programs compile and run",
        "Setting up a compiler and running Hello World",
        "Structure of a C program",
        "Variables and data types",
        "Constants and literals",
        "Operators and expressions",
        "Input and output with printf and scanf",
        "Type conversion and casting",
      ],
      { basics: true }
    ),
    mod(
      "c-flow",
      "C: control flow",
      "beginner",
      [
        "if, else and else if",
        "switch statement",
        "for loops",
        "while and do-while loops",
        "break and continue",
        "Nested loops and patterns|2",
      ],
      { basics: true }
    ),
    mod(
      "c-functions",
      "C: functions",
      "beginner",
      [
        "Defining and calling functions",
        "Parameters and return values",
        "Scope and storage classes",
        "Recursion basics|2",
      ],
      { basics: true }
    ),
    mod(
      "c-arrays",
      "C: arrays and strings",
      "beginner",
      ["1D arrays", "2D arrays", "Strings and character arrays", "String library functions"],
      { basics: true }
    ),

    // ---------- Intermediate ----------
    mod("c-pointers", "C: pointers and memory", "intermediate", [
      "Pointers and addresses",
      "Pointer arithmetic",
      "Pointers and arrays",
      "Pointers to pointers",
      "Pointers with functions|2",
      "Dynamic memory: malloc, calloc, realloc and free|2",
      "Memory leaks and dangling pointers",
    ]),
    mod("c-structs", "C: structures and unions", "intermediate", [
      "Structures",
      "Arrays of structures",
      "Nested structures and pointers to structures",
      "Unions",
      "Enums and typedef",
    ]),
    mod("c-files", "C: file handling", "intermediate", [
      "Reading and writing text files",
      "Binary files",
      "Random access with fseek and ftell",
      "Error handling with errno",
    ]),
    mod("c-preprocessor", "C: preprocessor and modular code", "intermediate", [
      "Macros and #define",
      "Conditional compilation",
      "Header files and multiple source files",
      "Makefiles and separate compilation",
    ]),

    // ---------- Advanced ----------
    mod("c-advanced", "C: advanced topics", "advanced", [
      "Bitwise operations and bit fields|2",
      "Function pointers and callbacks|2",
      "Variable arguments",
      "Linked list and stack implementation in C|2",
      "Memory layout: stack, heap and data segments",
      "Debugging with gdb and valgrind",
      "Undefined behaviour and safe coding",
      "Mini project: a text-based application|3",
    ]),
  ],
};

export const cpp: Domain = {
  id: "cpp",
  name: "C++ programming",
  description: "Basics, object-oriented C++, the STL and modern C++",
  group: "Programming languages",
  modules: [
    // ---------- Beginner ----------
    mod(
      "cpp-basics",
      "C++: getting started",
      "beginner",
      [
        "Compiling and running C++ programs",
        "Variables, data types and constants",
        "Operators and expressions",
        "Input and output with cin and cout",
        "Type conversion and auto",
      ],
      { basics: true }
    ),
    mod(
      "cpp-flow",
      "C++: control flow",
      "beginner",
      [
        "if, else and switch",
        "for, while and do-while loops",
        "break and continue",
        "Nested loops and pattern printing|2",
      ],
      { basics: true }
    ),
    mod(
      "cpp-functions",
      "C++: functions",
      "beginner",
      [
        "Functions, parameters and return values",
        "Pass by value and pass by reference",
        "Default arguments and function overloading",
        "Recursion basics|2",
        "Inline functions and scope",
      ],
      { basics: true }
    ),
    mod(
      "cpp-arrays",
      "C++: arrays, strings and pointers",
      "beginner",
      [
        "1D and 2D arrays",
        "C++ strings",
        "Vector basics",
        "Pointers and references",
        "Dynamic memory with new and delete",
      ],
      { basics: true }
    ),

    // ---------- Intermediate ----------
    mod("cpp-oop", "C++: object-oriented programming", "intermediate", [
      "Classes and objects",
      "Constructors and destructors",
      "Access specifiers and encapsulation",
      "The this pointer and static members",
      "Inheritance",
      "Polymorphism and virtual functions|2",
      "Abstract classes and interfaces",
      "Operator overloading",
      "Friend functions",
      "Templates: functions and classes|2",
    ]),
    mod("cpp-stl", "C++: the STL", "intermediate", [
      "Vector, array and deque",
      "List, stack and queue",
      "Set and multiset",
      "Map and unordered_map|2",
      "Priority queue",
      "Pair and tuple",
      "Iterators",
      "Algorithms: sort, binary_search, lower_bound and upper_bound",
      "Algorithms: min, max, reverse, rotate and accumulate",
      "Lambda functions and custom comparators",
    ]),
    mod("cpp-files", "C++: files and exceptions", "intermediate", [
      "File streams",
      "Exception handling with try and catch",
      "Namespaces",
    ]),

    // ---------- Advanced ----------
    mod("cpp-modern", "C++: modern C++", "advanced", [
      "Smart pointers: unique_ptr, shared_ptr and weak_ptr|2",
      "Move semantics and rvalue references|2",
      "Rule of three, five and zero",
      "RAII",
      "constexpr and other modern improvements",
      "Standard library: optional, variant and string_view",
      "Templates in depth and concepts|2",
      "Multithreading: thread, mutex and condition_variable|2",
      "Memory model and performance basics",
      "Build systems with CMake",
      "Mini project: a console application|3",
    ]),
  ],
};

export const java: Domain = {
  id: "java",
  name: "Java programming",
  description: "Core Java, OOP, collections and advanced Java",
  group: "Programming languages",
  modules: [
    // ---------- Beginner ----------
    mod(
      "java-basics",
      "Java: getting started",
      "beginner",
      [
        "How Java works: JDK, JRE and JVM",
        "Setting up and running Hello World",
        "Variables and data types",
        "Operators and expressions",
        "Input with Scanner and output",
        "Type casting and wrapper classes",
      ],
      { basics: true }
    ),
    mod(
      "java-flow",
      "Java: control flow",
      "beginner",
      [
        "if, else and switch",
        "Loops",
        "break and continue",
        "Nested loops and patterns|2",
      ],
      { basics: true }
    ),
    mod(
      "java-methods",
      "Java: methods, arrays and strings",
      "beginner",
      [
        "Methods, parameters and return values",
        "Method overloading",
        "Recursion basics|2",
        "1D and 2D arrays",
        "Strings and StringBuilder",
        "ArrayList basics",
      ],
      { basics: true }
    ),

    // ---------- Intermediate ----------
    mod("java-oop", "Java: object-oriented programming", "intermediate", [
      "Classes and objects",
      "Constructors and the this keyword",
      "Encapsulation and access modifiers",
      "static, final and initializer blocks",
      "Inheritance and super",
      "Polymorphism, overriding and overloading|2",
      "Abstract classes and interfaces|2",
      "Inner classes and anonymous classes",
      "Packages and imports",
      "Enums and records",
    ]),
    mod("java-exceptions", "Java: exceptions and I/O", "intermediate", [
      "Exception handling",
      "Custom exceptions",
      "File I/O with java.io and java.nio",
      "Serialization",
    ]),
    mod("java-collections", "Java: collections framework", "intermediate", [
      "List: ArrayList and LinkedList",
      "Set: HashSet, LinkedHashSet and TreeSet",
      "Map: HashMap, LinkedHashMap and TreeMap|2",
      "Queue, Deque and PriorityQueue",
      "Iterators, Comparable and Comparator",
      "Generics|2",
    ]),

    // ---------- Advanced ----------
    mod("java-advanced", "Java: advanced topics", "advanced", [
      "Lambda expressions and functional interfaces|2",
      "Streams API|2",
      "Optional",
      "Multithreading: Thread, Runnable and ExecutorService|3",
      "Synchronization, locks and concurrent collections|2",
      "CompletableFuture",
      "JDBC and database connectivity|2",
      "Reflection and annotations",
      "Memory management and garbage collection",
      "Build tools: Maven and Gradle",
      "Unit testing with JUnit",
      "Mini project: a console or JDBC application|3",
    ]),
  ],
};

export const python: Domain = {
  id: "python",
  name: "Python programming",
  description: "Python basics, data structures, OOP and advanced Python",
  group: "Programming languages",
  modules: [
    // ---------- Beginner ----------
    mod(
      "py-basics",
      "Python: getting started",
      "beginner",
      [
        "Installing Python and running scripts",
        "Variables and data types",
        "Operators and expressions",
        "Input and output",
        "Strings and string methods",
        "Type conversion",
      ],
      { basics: true }
    ),
    mod(
      "py-flow",
      "Python: control flow",
      "beginner",
      [
        "if, elif and else",
        "for and while loops",
        "break, continue and pass",
        "Pattern printing|2",
      ],
      { basics: true }
    ),
    mod(
      "py-structures",
      "Python: data structures",
      "beginner",
      [
        "Lists and list methods",
        "Tuples",
        "Sets",
        "Dictionaries|2",
        "List and dictionary comprehensions",
      ],
      { basics: true }
    ),
    mod(
      "py-functions",
      "Python: functions",
      "beginner",
      [
        "Defining functions, arguments and return values",
        "Default, keyword and variable arguments",
        "Scope and lambda functions",
        "Recursion basics|2",
      ],
      { basics: true }
    ),

    // ---------- Intermediate ----------
    mod("py-files", "Python: modules, files and errors", "intermediate", [
      "Modules and packages",
      "Virtual environments and pip",
      "File handling",
      "JSON and CSV",
      "Exception handling",
      "Dates and the standard library",
    ]),
    mod("py-oop", "Python: object-oriented programming", "intermediate", [
      "Classes and objects",
      "Constructors, instance and class variables",
      "Inheritance",
      "Polymorphism and method overriding",
      "Encapsulation and properties",
      "Magic (dunder) methods|2",
      "Dataclasses",
    ]),

    // ---------- Advanced ----------
    mod("py-advanced", "Python: advanced topics", "advanced", [
      "Iterators and generators|2",
      "Decorators|2",
      "Context managers",
      "Closures",
      "Type hints",
      "Regular expressions",
      "Multithreading, multiprocessing and asyncio|3",
      "Testing with pytest",
      "Packaging and publishing a package",
      "Working with APIs using requests",
      "Mini project: a command-line or API-based tool|3",
    ]),
  ],
};

export const oops: Domain = {
  id: "oops",
  name: "OOPs concepts",
  description: "Object-oriented ideas, SOLID, design patterns and low-level design",
  group: "Computer science core",
  modules: [
    // ---------- Beginner ----------
    mod("oops-foundations", "OOP foundations", "beginner", [
      "Procedural vs object-oriented thinking",
      "Classes and objects",
      "Attributes and methods",
      "Constructors and destructors",
      "Access modifiers",
    ]),
    mod("oops-pillars", "The four pillars", "beginner", [
      "Encapsulation",
      "Abstraction",
      "Inheritance and its types",
      "Polymorphism: compile-time and runtime|2",
    ]),

    // ---------- Intermediate ----------
    mod("oops-deeper", "Deeper concepts", "intermediate", [
      "Abstract classes vs interfaces",
      "Method overloading and overriding",
      "Static vs instance members",
      "Composition vs inheritance|2",
      "Association, aggregation and composition",
      "Shallow vs deep copy",
      "Exceptions in OOP",
      "Generics and templates",
    ]),
    mod("oops-principles", "Design principles", "intermediate", [
      "Cohesion and coupling",
      "DRY, KISS and YAGNI",
      "SOLID principles|3",
      "Law of Demeter",
    ]),

    // ---------- Advanced ----------
    mod("oops-patterns", "Design patterns", "advanced", [
      "Singleton",
      "Factory and abstract factory|2",
      "Builder",
      "Prototype",
      "Adapter",
      "Decorator",
      "Facade",
      "Observer|2",
      "Strategy|2",
      "Command",
      "State",
      "Iterator",
    ]),
    mod("oops-practice", "Low-level design in practice", "advanced", [
      "UML class and sequence diagrams|2",
      "Low-level design: parking lot, library and ATM|3",
      "Low-level design: elevator, chess and booking system|3",
      "Writing testable object-oriented code",
      "Interview questions on OOP|2",
    ]),
  ],
};