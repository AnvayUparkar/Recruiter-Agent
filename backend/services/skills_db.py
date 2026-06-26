"""Skills database and standardizer for intelligent resume parsing."""

from typing import Dict, List, Set, Tuple

# Categories for grouping skills
SKILL_CATEGORIES: Dict[str, List[str]] = {
    "Programming": [
        "Python", "Java", "C", "C++", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin", "Swift", "Ruby", "PHP"
    ],
    "Frontend": [
        "HTML", "CSS", "React", "Next.js", "Angular", "Vue", "Svelte", "Tailwind CSS", "Bootstrap", "Redux"
    ],
    "Backend": [
        "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Ruby on Rails", "Laravel", "ASP.NET", "GraphQL"
    ],
    "Databases": [
        "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis", "Cassandra", "DynamoDB", "Elasticsearch", "Oracle", "SQL Server"
    ],
    "Cloud": [
        "AWS", "Azure", "Google Cloud", "GCP", "DigitalOcean", "Heroku", "Vercel", "Netlify"
    ],
    "DevOps": [
        "Docker", "Kubernetes", "Jenkins", "Git", "GitHub", "GitLab", "Bitbucket", "Terraform", "Ansible", "CircleCI", "Travis CI"
    ],
    "AI / ML": [
        "Machine Learning", "Deep Learning", "Artificial Intelligence", "NLP", "Computer Vision", 
        "TensorFlow", "PyTorch", "Scikit-learn", "LangChain", "HuggingFace", "OpenAI", "Gemini", 
        "LlamaIndex", "Keras", "Pandas", "NumPy", "Data Science"
    ],
    "Tools": [
        "Postman", "Firebase", "Canva API", "REST API", "Figma", "Jira", "Trello", "Slack", "Notion", "Webpack", "Vite"
    ]
}

# Alias mapping: lowercase alias -> Standardized Name
SKILL_ALIASES: Dict[str, str] = {
    "js": "JavaScript",
    "ts": "TypeScript",
    "golang": "Go",
    "cpp": "C++",
    "c plus plus": "C++",
    "c#": "C#",
    "c sharp": "C#",
    "html5": "HTML",
    "css3": "CSS",
    "reactjs": "React",
    "react.js": "React",
    "nextjs": "Next.js",
    "vuejs": "Vue",
    "vue.js": "Vue",
    "angularjs": "Angular",
    "nodejs": "Node.js",
    "node": "Node.js",
    "expressjs": "Express",
    "spring": "Spring Boot",
    "postgres": "PostgreSQL",
    "mongo": "MongoDB",
    "gcp": "Google Cloud",
    "amazon web services": "AWS",
    "k8s": "Kubernetes",
    "github actions": "GitHub",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "ai": "Artificial Intelligence",
    "cv": "Computer Vision",
    "natural language processing": "NLP",
    "pytorch lightning": "PyTorch",
    "tf": "TensorFlow",
    "sklearn": "Scikit-learn",
    "rest": "REST API"
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
