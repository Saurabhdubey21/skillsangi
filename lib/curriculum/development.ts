import { mod, type Domain } from "./types";

export const web: Domain = {
  id: "web",
  name: "Web development",
  description: "HTML, CSS and JavaScript, then a full-stack path of your choice",
  group: "Development",
  stacks: [
    {
      id: "mern",
      name: "MERN",
      note: "MongoDB, Express, React and Node.js. One language, JavaScript, everywhere.",
    },
    {
      id: "spring",
      name: "Java + Spring Boot",
      note: "Java backend with Spring Boot. Widely used in companies and enterprise jobs.",
    },
    {
      id: "python",
      name: "Python + Django",
      note: "Python backend with Django. Quick to build with and good if you also like AI.",
    },
  ],
  modules: [
    // ---------- Core for every stack ----------
    mod("web-html", "HTML", "beginner", [
      "How the web works",
      "HTML document structure",
      "Text, links and images",
      "Lists and tables",
      "Forms and inputs|2",
      "Semantic HTML",
      "Accessibility basics",
      "Media: audio, video and iframes",
    ]),
    mod("web-css", "CSS", "beginner", [
      "Selectors and specificity|2",
      "The box model",
      "Colors, fonts and units",
      "Display, position and z-index|2",
      "Flexbox|3",
      "CSS Grid|3",
      "Responsive design and media queries|2",
      "Transitions and animations",
      "CSS variables",
      "Tailwind CSS or Bootstrap basics|2",
    ]),
    mod("web-js", "JavaScript", "beginner", [
      "Variables, data types and operators",
      "Control flow and loops",
      "Functions and arrow functions",
      "Arrays and array methods|2",
      "Objects and destructuring",
      "The DOM and events|3",
      "ES6+ features: spread, rest and modules",
      "Asynchronous JavaScript: callbacks, promises and async/await|3",
      "Fetch API and JSON|2",
      "Error handling",
      "Local storage and sessions",
      "Mini projects: to-do list and weather app|3",
    ]),
    mod("web-tools", "Developer tools", "beginner", [
      "Using the terminal",
      "Git basics: commit, branch and merge|2",
      "GitHub: push, pull requests and collaboration",
      "Browser developer tools",
      "Deploying a static site",
    ]),

    // ---------- MERN ----------
    mod(
      "web-react",
      "React",
      "intermediate",
      [
        "Setting up React with Vite",
        "JSX and components",
        "Props and state|2",
        "Events and forms",
        "Hooks: useState and useEffect|3",
        "Conditional rendering and lists",
        "useRef, useMemo and useCallback",
        "Context API|2",
        "Custom hooks",
        "React Router|2",
        "Data fetching and loading states|2",
        "Styling in React",
        "State management with Redux Toolkit|2",
      ],
      { stacks: ["mern"] }
    ),
    mod(
      "web-node",
      "Node.js and Express",
      "intermediate",
      [
        "Node.js basics and modules",
        "npm and package.json",
        "Writing a server with Express|2",
        "Routing and middleware|2",
        "REST API design|2",
        "Environment variables",
        "Error handling",
        "Validation",
        "CORS",
      ],
      { stacks: ["mern"] }
    ),
    mod(
      "web-mongo",
      "MongoDB",
      "intermediate",
      [
        "MongoDB concepts: documents and collections",
        "CRUD operations|2",
        "Queries and operators",
        "Aggregation pipeline|2",
        "Mongoose schemas and models|2",
        "Relationships and population",
        "Indexes",
      ],
      { stacks: ["mern"] }
    ),
    mod(
      "web-mern-auth",
      "MERN: authentication, security and testing",
      "advanced",
      [
        "Password hashing",
        "JWT authentication|3",
        "Role-based authorization",
        "Cookies and sessions",
        "Security: XSS, CSRF and rate limiting|2",
        "File uploads",
        "Testing with Jest and React Testing Library|2",
        "API testing with Postman",
      ],
      { stacks: ["mern"] }
    ),
    mod(
      "web-mern-full",
      "MERN: full stack and deployment",
      "advanced",
      [
        "Connecting React with the Express API|2",
        "TypeScript basics|3",
        "Next.js fundamentals|3",
        "Real-time features with Socket.io|2",
        "Performance optimization",
        "Docker basics",
        "CI/CD basics",
        "Deploying with Vercel, Render and MongoDB Atlas|2",
        "Capstone: a full-stack MERN project|3",
        "Second project: your own idea|3",
      ],
      { stacks: ["mern"] }
    ),

    // ---------- Java + Spring Boot ----------
    mod(
      "web-java-essentials",
      "Java essentials for backend",
      "beginner",
      [
        "Java syntax, data types and control flow|2",
        "Methods, arrays and strings|2",
        "Object-oriented programming in Java|3",
        "Collections and generics|2",
        "Exceptions and file I/O",
        "Lambdas and streams|2",
      ],
      { stacks: ["spring"] }
    ),
    mod(
      "web-sql",
      "SQL for backend developers",
      "intermediate",
      [
        "Tables, joins and queries|3",
        "Normalization and schema design",
        "Indexes",
        "Transactions",
      ],
      { stacks: ["spring", "python"] }
    ),
    mod(
      "web-spring",
      "Spring Boot",
      "intermediate",
      [
        "Spring Boot setup and project structure",
        "Dependency injection and IoC|2",
        "Beans and configuration",
        "Building REST controllers|3",
        "Request handling and validation|2",
        "Exception handling",
        "Spring Data JPA and Hibernate|3",
        "Entity relationships|2",
        "Profiles and configuration properties",
        "Logging",
      ],
      { stacks: ["spring"] }
    ),
    mod(
      "web-spring-security",
      "Spring: security and testing",
      "advanced",
      [
        "Spring Security basics|3",
        "JWT authentication",
        "Role-based access",
        "OAuth2 and social login",
        "Unit tests with JUnit and Mockito|2",
        "Integration testing",
        "API documentation with Swagger",
      ],
      { stacks: ["spring"] }
    ),
    mod(
      "web-spring-prod",
      "Spring: microservices and deployment",
      "advanced",
      [
        "Maven and Gradle",
        "Microservices with Spring Cloud|3",
        "Messaging with Kafka or RabbitMQ",
        "Caching with Redis",
        "Docker and deployment|2",
        "Connecting a React frontend|2",
        "Capstone: a full-stack Spring Boot project|3",
        "Second project: your own idea|3",
      ],
      { stacks: ["spring"] }
    ),

    // ---------- Python + Django ----------
    mod(
      "web-py-essentials",
      "Python essentials for backend",
      "beginner",
      [
        "Python syntax and data types|2",
        "Functions and control flow",
        "Lists, dicts, sets and comprehensions|2",
        "Object-oriented programming in Python|2",
        "Modules, virtual environments and pip",
        "File handling and exceptions",
      ],
      { stacks: ["python"] }
    ),
    mod(
      "web-django",
      "Django",
      "intermediate",
      [
        "Django setup and project structure",
        "URLs, views and templates|2",
        "Models and the ORM|3",
        "Migrations",
        "The admin panel",
        "Forms and validation|2",
        "Static and media files",
        "Class-based views",
        "Authentication and sessions|2",
        "Relationships: foreign key and many-to-many|2",
      ],
      { stacks: ["python"] }
    ),
    mod(
      "web-django-api",
      "Django: APIs, security and testing",
      "advanced",
      [
        "Django REST Framework|3",
        "Serializers and viewsets|2",
        "Token and JWT authentication|2",
        "Permissions",
        "Testing with pytest or Django tests|2",
        "Background tasks with Celery",
        "Caching with Redis",
      ],
      { stacks: ["python"] }
    ),
    mod(
      "web-django-prod",
      "Django: production and deployment",
      "advanced",
      [
        "Flask or FastAPI basics|3",
        "Connecting a React frontend",
        "Docker and deployment|2",
        "PostgreSQL in production",
        "Capstone: a full-stack Django project|3",
        "Second project: your own idea|3",
      ],
      { stacks: ["python"] }
    ),

    // ---------- Closing module for every stack ----------
    mod("web-career", "Portfolio and interview preparation", "advanced", [
      "Building a portfolio site",
      "Writing a good README and resume",
      "Web interview questions: JavaScript, the browser and HTTP|2",
      "System design basics for web apps",
    ]),
  ],
};

export const aiml: Domain = {
  id: "aiml",
  name: "AI and machine learning",
  description: "Python, maths, NumPy and pandas, then machine learning, deep learning and deployment",
  group: "Development",
  languageFirst: ["python"],
  modules: [
    // ---------- Beginner ----------
    mod("ai-maths", "Maths for machine learning", "beginner", [
      "Linear algebra: vectors and matrices|2",
      "Matrix operations, determinants and inverses",
      "Eigenvalues and eigenvectors|2",
      "Calculus: derivatives and gradients|2",
      "Partial derivatives and the chain rule",
      "Probability basics|2",
      "Conditional probability and Bayes' theorem|2",
      "Random variables and distributions|2",
      "Statistics: mean, variance and standard deviation",
      "Hypothesis testing and confidence intervals|2",
    ]),
    mod("ai-numpy", "NumPy", "beginner", [
      "Arrays and how to create them",
      "Indexing and slicing",
      "Broadcasting|2",
      "Vectorized operations",
      "Linear algebra with NumPy",
    ]),
    mod("ai-pandas", "pandas", "beginner", [
      "Series and DataFrames",
      "Reading CSV and Excel files",
      "Selecting and filtering|2",
      "Cleaning missing data|2",
      "GroupBy and aggregation|2",
      "Merging and joining",
      "Time series basics",
      "Mini project: analyse a real dataset|3",
    ]),
    mod("ai-viz", "Data visualisation", "beginner", [
      "Matplotlib basics",
      "Seaborn",
      "Choosing the right chart",
      "Exploratory data analysis|2",
    ]),

    // ---------- Intermediate ----------
    mod("ai-ml", "Machine learning", "intermediate", [
      "What ML is: supervised, unsupervised and reinforcement learning",
      "Train, validation and test sets",
      "Linear regression|3",
      "Gradient descent|2",
      "Logistic regression|2",
      "Bias, variance, overfitting and underfitting|2",
      "Regularization: L1 and L2",
      "K-nearest neighbours",
      "Decision trees",
      "Random forests and bagging|2",
      "Boosting: Gradient Boosting and XGBoost|2",
      "Support vector machines",
      "Naive Bayes",
      "Evaluation metrics: accuracy, precision, recall, F1 and ROC|3",
      "Cross-validation and hyperparameter tuning|2",
      "Feature engineering and scaling|2",
      "Handling imbalanced data",
      "Mini project: end-to-end ML on a Kaggle dataset|3",
    ]),
    mod("ai-unsupervised", "Unsupervised learning", "intermediate", [
      "K-means clustering",
      "Hierarchical clustering",
      "DBSCAN",
      "PCA and dimensionality reduction|2",
      "Anomaly detection",
      "Recommender system basics",
    ]),

    // ---------- Advanced ----------
    mod("ai-deep", "Deep learning", "advanced", [
      "Neural network basics: neurons, layers and activations|2",
      "Forward and backpropagation|3",
      "Loss functions and optimizers|2",
      "PyTorch or TensorFlow basics|3",
      "Training tips: batch norm, dropout and learning rate|2",
      "Convolutional neural networks|3",
      "Transfer learning",
      "Recurrent networks and LSTMs|2",
      "Object detection basics",
      "Mini project: an image classifier|3",
    ]),
    mod("ai-nlp", "NLP and modern AI", "advanced", [
      "Text preprocessing and tokenization",
      "Word embeddings",
      "Attention and transformers|3",
      "Using pre-trained models with Hugging Face|2",
      "Large language models and prompting|2",
      "Retrieval-augmented generation|2",
      "Fine-tuning basics",
      "Mini project: a text or chatbot application|3",
    ]),
    mod("ai-mlops", "MLOps and deployment", "advanced", [
      "Saving and serving models|2",
      "Building an API with FastAPI or Flask",
      "Experiment tracking",
      "Docker for ML",
      "Model monitoring and drift",
      "Data pipelines basics",
      "Responsible AI: bias and fairness",
      "Capstone: a deployed ML project with a web interface|3",
      "Reading research papers",
    ]),
  ],
};