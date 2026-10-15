import { mod, type Domain } from "./types";

export const cn: Domain = {
  id: "cn",
  name: "Computer networks (CN)",
  description: "From the OSI model to TCP, DNS, HTTPS and network security",
  group: "Computer science core",
  modules: [
    // ---------- Beginner ----------
    mod("cn-basics", "Networking basics", "beginner", [
      "What a network is: LAN, MAN and WAN",
      "Network topologies",
      "The OSI model|2",
      "The TCP/IP model",
      "Network devices: hub, switch, router and bridge",
      "Transmission media",
      "Bandwidth, throughput and latency",
      "Switching: circuit, packet and message",
    ]),
    mod("cn-datalink", "Physical and data link layer", "beginner", [
      "Encoding and modulation basics",
      "Error detection: parity, checksum and CRC|2",
      "Error correction: Hamming code",
      "Framing",
      "Flow control: stop-and-wait and sliding window|2",
      "ARQ protocols: Go-Back-N and Selective Repeat|2",
    ]),

    // ---------- Intermediate ----------
    mod("cn-mac", "Medium access and LANs", "intermediate", [
      "MAC protocols: ALOHA and CSMA/CD|2",
      "Ethernet",
      "Wi-Fi and CSMA/CA",
      "ARP",
      "VLANs and switching",
    ]),
    mod("cn-network", "Network layer", "intermediate", [
      "IPv4 addressing|2",
      "Subnetting and CIDR|3",
      "IPv6",
      "NAT",
      "ICMP and ping",
      "Routing: distance vector and link state|2",
      "RIP, OSPF and BGP",
      "DHCP",
    ]),
    mod("cn-transport", "Transport layer", "intermediate", [
      "Ports and sockets",
      "UDP",
      "TCP segments and the three-way handshake|2",
      "TCP flow control and congestion control|3",
      "TCP vs UDP",
    ]),

    // ---------- Advanced ----------
    mod("cn-application", "Application layer and security", "advanced", [
      "DNS|2",
      "HTTP and HTTPS|2",
      "HTTP versions: 1.1, 2 and 3",
      "Email: SMTP, POP3 and IMAP",
      "FTP and SSH",
      "REST and WebSockets",
      "CDNs and load balancers",
      "Cryptography basics: symmetric and asymmetric|2",
      "TLS handshake and certificates|2",
      "Firewalls, VPNs and common attacks",
      "Socket programming|2",
      "Packet analysis with Wireshark",
    ]),
    mod("cn-practice", "Interview and GATE practice", "advanced", [
      "Subnetting numericals|2",
      "Congestion control and sliding window numericals|2",
      "Common CN interview questions",
    ]),
  ],
};

export const dbms: Domain = {
  id: "dbms",
  name: "DBMS",
  description: "ER modelling, normalization, transactions, indexing and NoSQL",
  group: "Computer science core",
  modules: [
    // ---------- Beginner ----------
    mod("dbms-intro", "Introduction to databases", "beginner", [
      "What a database and a DBMS are",
      "File system vs DBMS",
      "Three-schema architecture",
      "Data models",
      "Database users and roles",
    ]),
    mod("dbms-er", "ER modelling", "beginner", [
      "Entities, attributes and relationships",
      "Keys: super, candidate, primary and foreign|2",
      "Cardinality and participation",
      "Weak entities",
      "Generalization and specialization",
      "Converting an ER diagram to tables|2",
    ]),
    mod("dbms-relational", "The relational model", "beginner", [
      "Relations, tuples and attributes",
      "Integrity constraints",
      "Relational algebra|3",
      "Tuple relational calculus",
    ]),

    // ---------- Intermediate ----------
    mod("dbms-normalization", "Normalization", "intermediate", [
      "Functional dependencies|2",
      "Armstrong's axioms and attribute closure|2",
      "Finding candidate keys|2",
      "1NF, 2NF and 3NF|2",
      "BCNF",
      "Multivalued dependency and 4NF",
      "Decomposition: lossless and dependency preserving|2",
    ]),
    mod("dbms-transactions", "Transactions and concurrency", "intermediate", [
      "Transactions and ACID|2",
      "Schedules and serializability|2",
      "Conflict and view serializability",
      "Concurrency problems",
      "Lock-based protocols and two-phase locking|2",
      "Timestamp ordering",
      "Deadlock handling",
      "Isolation levels|2",
    ]),

    // ---------- Advanced ----------
    mod("dbms-storage", "Storage and indexing", "advanced", [
      "Disk storage and file organization",
      "Indexing: primary, secondary and clustered|2",
      "B-tree and B+ tree|3",
      "Hashing",
      "Query processing and optimization|2",
      "Query execution plans",
    ]),
    mod("dbms-recovery", "Recovery and distributed databases", "advanced", [
      "Log-based recovery",
      "Checkpoints and ARIES basics",
      "Backup and recovery",
      "Distributed databases",
      "CAP theorem and BASE",
      "Sharding and replication|2",
    ]),
    mod("dbms-nosql", "NoSQL and interview practice", "advanced", [
      "Types of NoSQL databases",
      "MongoDB basics",
      "Redis basics",
      "Choosing between SQL and NoSQL",
      "DBMS interview questions|2",
    ]),
  ],
};

export const sql: Domain = {
  id: "sql",
  name: "SQL",
  description: "Queries, joins, window functions, performance and interview practice",
  group: "Computer science core",
  modules: [
    // ---------- Beginner ----------
    mod("sql-basics", "SQL basics", "beginner", [
      "Setting up MySQL or PostgreSQL",
      "Creating databases and tables",
      "Data types",
      "INSERT, UPDATE and DELETE",
      "SELECT and WHERE|2",
      "ORDER BY, LIMIT and DISTINCT",
      "AND, OR, IN, BETWEEN and LIKE",
      "Handling NULL values",
      "Constraints: primary key, foreign key, unique, check and default|2",
      "ALTER, DROP and TRUNCATE",
    ]),
    mod("sql-aggregation", "Aggregation", "beginner", [
      "Aggregate functions",
      "GROUP BY|2",
      "HAVING",
      "WHERE vs HAVING",
    ]),

    // ---------- Intermediate ----------
    mod("sql-joins", "Joins and subqueries", "intermediate", [
      "INNER JOIN|2",
      "LEFT, RIGHT and FULL JOIN|2",
      "CROSS JOIN and SELF JOIN",
      "Subqueries|2",
      "Correlated subqueries",
      "EXISTS and NOT EXISTS",
      "UNION, INTERSECT and EXCEPT",
      "CASE expressions",
      "String, date and numeric functions|2",
      "Views",
    ]),
    mod("sql-window", "Window functions and CTEs", "intermediate", [
      "ROW_NUMBER, RANK and DENSE_RANK|2",
      "LAG and LEAD",
      "Running totals and moving averages|2",
      "NTILE and partitions",
      "Common table expressions",
      "Recursive CTEs|2",
    ]),

    // ---------- Advanced ----------
    mod("sql-performance", "Performance and design", "advanced", [
      "Indexes and when to use them|2",
      "Reading EXPLAIN plans|2",
      "Query optimization techniques|2",
      "Normalization in practice",
      "Schema design for an application|2",
      "Transactions: COMMIT and ROLLBACK",
      "Locking and isolation levels in SQL",
      "Stored procedures and functions",
      "Triggers",
      "Pivoting and JSON in SQL",
      "Security: roles, privileges and SQL injection",
    ]),
    mod("sql-practice", "SQL practice", "advanced", [
      "Easy interview problems|2",
      "Medium interview problems|3",
      "Hard interview problems|3",
      "Mini project: design and query a database for an app|3",
    ]),
  ],
};

export const systemdesign: Domain = {
  id: "systemdesign",
  name: "System design",
  description: "Scalability, data, messaging and 15 classic design case studies",
  group: "Computer science core",
  modules: [
    // ---------- Beginner ----------
    mod("sd-fundamentals", "Fundamentals", "beginner", [
      "What system design is and how interviews work",
      "Client-server architecture",
      "Scalability: vertical vs horizontal|2",
      "Latency, throughput and availability",
      "Reliability and fault tolerance",
      "Back-of-the-envelope estimation|2",
      "APIs: REST, gRPC and GraphQL|2",
    ]),
    mod("sd-blocks", "Building blocks", "beginner", [
      "DNS and how a request travels",
      "Load balancers|2",
      "Caching basics|2",
      "Databases: SQL vs NoSQL|2",
      "Content delivery networks",
    ]),

    // ---------- Intermediate ----------
    mod("sd-data", "Data and scaling", "intermediate", [
      "Database indexing at scale",
      "Replication|2",
      "Sharding and partitioning|2",
      "Consistent hashing|2",
      "CAP theorem and consistency models|2",
      "Cache strategies: write-through, write-back and eviction|2",
      "Message queues and asynchronous processing|2",
      "Pub/sub and event streaming with Kafka",
      "Rate limiting|2",
      "API gateways",
      "Unique ID generation",
    ]),
    mod("sd-reliability", "Communication and reliability", "intermediate", [
      "Microservices vs monolith|2",
      "Service discovery",
      "Idempotency and retries",
      "Circuit breakers",
      "Distributed transactions and sagas|2",
      "Observability: logs, metrics and tracing",
      "Security: authentication and authorization",
      "Blob and object storage",
    ]),

    // ---------- Advanced ----------
    mod("sd-cases", "Case studies", "advanced", [
      "URL shortener|2",
      "Pastebin",
      "Rate limiter service",
      "Chat application like WhatsApp|3",
      "News feed or social timeline|3",
      "Notification system",
      "Video streaming like YouTube|3",
      "Ride sharing like Uber|3",
      "Search autocomplete|2",
      "Web crawler",
      "Distributed cache|2",
      "Payment system|3",
      "E-commerce platform|3",
      "Key-value store|3",
      "File storage like Google Drive|3",
    ]),
    mod("sd-interview", "Interview practice", "advanced", [
      "A framework for answering a design question|2",
      "Discussing trade-offs",
      "Mock design interviews|3",
      "Learning from real engineering blogs",
    ]),
  ],
};

export const cloud: Domain = {
  id: "cloud",
  name: "Cloud computing",
  description: "Cloud basics, AWS services, Docker, Kubernetes and infrastructure as code",
  group: "Computer science core",
  modules: [
    // ---------- Beginner ----------
    mod("cloud-basics", "Cloud basics", "beginner", [
      "What cloud computing is",
      "IaaS, PaaS and SaaS",
      "Public, private and hybrid cloud",
      "Regions and availability zones",
      "The shared responsibility model",
      "Pricing and cost basics",
      "Overview of AWS, Azure and Google Cloud",
    ]),
    mod("cloud-linux", "Linux and networking for the cloud", "beginner", [
      "Linux command line basics|2",
      "Users, permissions and processes",
      "Networking basics: IP, DNS and ports",
      "SSH and key pairs",
      "Bash scripting basics|2",
    ]),

    // ---------- Intermediate ----------
    mod("cloud-services", "Core cloud services (AWS as the reference)", "intermediate", [
      "IAM: users, roles and policies|2",
      "Compute: EC2|2",
      "Storage: S3|2",
      "Block and file storage: EBS and EFS",
      "Networking: VPC, subnets and security groups|3",
      "Load balancing and auto scaling|2",
      "Databases: RDS and DynamoDB|2",
      "DNS and CDN: Route 53 and CloudFront",
      "Monitoring with CloudWatch",
      "Serverless: Lambda and API Gateway|2",
      "Messaging: SQS and SNS",
    ]),
    mod("cloud-devops", "Containers and DevOps basics", "intermediate", [
      "Git and version control",
      "Docker images and containers|3",
      "Docker Compose",
      "CI/CD concepts and GitHub Actions|2",
      "Deploying a web app to the cloud|2",
    ]),

    // ---------- Advanced ----------
    mod("cloud-k8s", "Kubernetes and infrastructure as code", "advanced", [
      "Kubernetes architecture|2",
      "Pods, deployments and services|3",
      "ConfigMaps, secrets and volumes",
      "Ingress and scaling",
      "Helm basics",
      "Terraform basics|3",
      "Configuration management with Ansible",
      "Managed Kubernetes: EKS",
    ]),
    mod("cloud-architecture", "Security, cost and architecture", "advanced", [
      "Cloud security best practices|2",
      "Encryption and key management",
      "Well-Architected principles|2",
      "High availability and disaster recovery|2",
      "Cost optimization",
      "Logging, monitoring and alerting|2",
      "Multi-cloud basics",
      "Cloud certification preparation|2",
      "Capstone: deploy a scalable app with CI/CD and infrastructure as code|3",
    ]),
  ],
};