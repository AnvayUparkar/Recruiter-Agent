"""Skills database and standardizer for intelligent resume parsing."""

from typing import Dict, List, Set, Tuple

# Categories for grouping skills
SKILL_CATEGORIES: Dict[str, List[str]] = {
    "Programming": [
        "Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust", 
        "Kotlin", "Swift", "Ruby", "PHP", "Scala", "R", "Perl", "Shell", "Bash"
    ],
    "Frontend": [
        "HTML", "CSS", "React", "Next.js", "Angular", "Vue", "Svelte", "Tailwind CSS", 
        "Bootstrap", "Redux", "Material-UI", "Sass", "Less", "Webpack", "Vite"
    ],
    "Backend": [
        "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Ruby on Rails", 
        "Laravel", "ASP.NET", "GraphQL", ".NET", "ASP.NET Core"
    ],
    "Databases": [
        "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis", "Cassandra", "DynamoDB", 
        "Elasticsearch", "Oracle", "SQL Server", "MariaDB", "Neo4j", "CouchDB"
    ],
    "Cloud": [
        "AWS", "Azure", "Google Cloud", "GCP", "DigitalOcean", "Heroku", "Vercel", "Netlify"
    ],
    "AWS Services": [
        "AWS Lambda", "AWS S3", "AWS EC2", "AWS RDS", "AWS Glue", "AWS CloudFormation",
        "AWS CloudWatch", "AWS Secrets Manager", "AWS ECS", "AWS EKS", "AWS DynamoDB"
    ],
    "DevOps": [
        "Docker", "Kubernetes", "Jenkins", "Git", "GitHub", "GitLab", "Bitbucket", 
        "Terraform", "Ansible", "CircleCI", "Travis CI", "Azure DevOps", "CI/CD"
    ],
    "AI / ML": [
        "Machine Learning", "Deep Learning", "Artificial Intelligence", "Generative AI",
        "NLP", "Computer Vision", "LLM", "TensorFlow", "PyTorch", "Scikit-learn", 
        "LangChain", "HuggingFace", "OpenAI", "Gemini", "LlamaIndex", "Keras", 
        "Pandas", "NumPy", "Data Science"
    ],
    "APIs": [
        "REST API", "SOAP API", "GraphQL", "WebSocket", "gRPC"
    ],
    "Project Management": [
        "Agile", "Scrum", "Kanban", "Jira", "Trello", "PMP", "Scrum Master", "Product Management"
    ],
    "Tools": [
        "Postman", "Firebase", "Figma", "Slack", "Notion", "Confluence", "VS Code",
        "IntelliJ", "Eclipse", "Vim", "Git", "Maven", "Gradle", "npm", "yarn"
    ]
}

# Alias mapping: lowercase alias -> Standardized Name
SKILL_ALIASES: Dict[str, str] = {
    # Programming Languages
    "js": "JavaScript",
    "ts": "TypeScript",
    "golang": "Go",
    "cpp": "C++",
    "c plus plus": "C++",
    "c#": "C#",
    "c sharp": "C#",
    "py": "Python",
    
    # Frontend
    "html5": "HTML",
    "css3": "CSS",
    "reactjs": "React",
    "react.js": "React",
    "nextjs": "Next.js",
    "next": "Next.js",
    "vuejs": "Vue",
    "vue.js": "Vue",
    "angularjs": "Angular",
    
    # Backend
    "nodejs": "Node.js",
    "node": "Node.js",
    "expressjs": "Express",
    "express.js": "Express",
    "spring": "Spring Boot",
    "rails": "Ruby on Rails",
    
    # Databases
    "postgres": "PostgreSQL",
    "psql": "PostgreSQL",
    "mongo": "MongoDB",
    "sql server": "SQL Server",
    "mssql": "SQL Server",
    
    # Cloud
    "gcp": "Google Cloud",
    "amazon web services": "AWS",
    "aws services": "AWS",
    "microsoft azure": "Azure",
    
    # Cloud Services - AWS
    "lambda": "AWS Lambda",
    "aws lambda": "AWS Lambda",
    "s3": "AWS S3",
    "aws s3": "AWS S3",
    "ec2": "AWS EC2",
    "aws ec2": "AWS EC2",
    "rds": "AWS RDS",
    "aws rds": "AWS RDS",
    "glue": "AWS Glue",
    "aws glue": "AWS Glue",
    "cloudformation": "AWS CloudFormation",
    "cloudwatch": "AWS CloudWatch",
    "secrets manager": "AWS Secrets Manager",
    "aws secrets manager": "AWS Secrets Manager",
    
    # DevOps
    "k8s": "Kubernetes",
    "github actions": "GitHub",
    "azure devops": "Azure DevOps",
    "ado": "Azure DevOps",
    
    # AI/ML
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "ai": "Artificial Intelligence",
    "generative ai": "Generative AI",
    "generative artificial intelligence": "Generative AI",
    "gen ai": "Generative AI",
    "llm": "LLM",
    "llm's": "LLM",
    "llms": "LLM",
    "large language models": "LLM",
    "cv": "Computer Vision",
    "natural language processing": "NLP",
    "pytorch lightning": "PyTorch",
    "tf": "TensorFlow",
    "sklearn": "Scikit-learn",
    "scikit learn": "Scikit-learn",
    "hugging face": "HuggingFace",
    
    # APIs
    "rest": "REST API",
    "rest api": "REST API",
    "rest-based api": "REST API",
    "rest-based apis": "REST API",
    "restful": "REST API",
    "restful api": "REST API",
    "soap": "SOAP API",
    "soap api": "SOAP API",
    "soap-based api": "SOAP API",
    "soap-based apis": "SOAP API",
    
    # Databases
    "oracle db": "Oracle",
    "oracle database": "Oracle",
    "ms sql": "SQL Server",
    
    # Project Management
    "pmp": "PMP",
    "certified scrum master": "Scrum Master",
    "csm": "Scrum Master",
    "agile methodology": "Agile",
    "scrum methodology": "Scrum",
}

def get_all_standard_skills() -> Set[str]:
    """Returns a flat set of all standardized skills."""
    skills = set()
    for cat_skills in SKILL_CATEGORIES.values():
        skills.update(cat_skills)
    return skills

def map_skill(skill: str) -> str:
    """Maps a raw skill string to its standard format using exact/alias matching."""
    lower_skill = skill.strip().lower()
    if lower_skill in SKILL_ALIASES:
        return SKILL_ALIASES[lower_skill]
    
    # Try case-insensitive matching against standard categories
    for std_skill in get_all_standard_skills():
        if lower_skill == std_skill.lower():
            return std_skill
            
    return skill.strip()
