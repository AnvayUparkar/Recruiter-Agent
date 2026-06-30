"""Test script for the production-grade resume parser."""

import io
from services.resume_parser import ResumeParser

parser = ResumeParser()

# Test 1: Skills extraction
print("=" * 80)
print("TEST 1: Skills Extraction")
print("=" * 80)
test_text = """
I am a software engineer proficient in C++, Java, Node.js, Next.js, HTML5, React, 
and Machine Learning. I have used Amazon Web Services, AWS Lambda, S3, AWS Glue, 
REST-based APIs, SOAP-based APIs, and Generative Artificial Intelligence (LLM's).
"""

parsed = parser._extract_structured_data(test_text)
print("Skills detected:")
for skill in parsed.skills:
    print(f"  - {skill}")

# Test 2: Experience extraction with Company-Designation-Duration pattern
print("\n" + "=" * 80)
print("TEST 2: Experience Extraction")
print("=" * 80)
experience_text = """
WORK EXPERIENCE

Worley Services Pvt. Ltd. – Technical Specialist - 6.5 Years
Bangalore, India
Jan 2018 - Present

• Led AWS cloud migration initiatives for enterprise clients
• Developed Python solutions for data processing using AWS Glue
• Built REST APIs and integrated with EcoSys and ERM systems
• Technologies: AWS, Python, Lambda, S3, AWS Glue, REST API, SOAP, Secrets Manager

Accenture Services Pvt. Ltd. – Associate Manager - 12 Years
Mumbai, India
Jun 2006 - Dec 2017

• Managed multiple projects for Fortune 500 clients
• Led teams of 10+ developers
• Implemented Agile methodologies and DevOps practices
• Technologies: Java, Spring Boot, Oracle, SQL Server, Azure DevOps, C#
"""

parsed_exp = parser._extract_structured_data(experience_text)
print(f"Years of experience: {parsed_exp.years_of_experience}")
print(f"\nExperience entries found: {len(parsed_exp.experience)}")
for i, exp in enumerate(parsed_exp.experience, 1):
    print(f"\nExperience {i}:")
    print(f"  Company: {exp.get('company', 'N/A')}")
    print(f"  Designation: {exp.get('designation', 'N/A')}")
    print(f"  Duration: {exp.get('duration', 'N/A')}")
    print(f"  Location: {exp.get('location', 'N/A')}")
    print(f"  Experience Years: {exp.get('experience_years', 0)}")
    print(f"  Technologies: {', '.join(exp.get('technologies', []))}")
    print(f"  Responsibilities (showing first 3):")
    for resp in exp.get('responsibilities', [])[:3]:
        print(f"    • {resp}")

# Test 3: Education extraction
print("\n" + "=" * 80)
print("TEST 3: Education Extraction")
print("=" * 80)
education_text = """
EDUCATION

Bachelor of Technology (B.Tech) in Computer Science
Indian Institute of Technology, Delhi
University of Delhi
2002 - 2006

Master of Business Administration (MBA)
Harvard Business School
Boston, MA
2010
"""

parsed_edu = parser._extract_structured_data(education_text)
print(f"Education entries found: {len(parsed_edu.education)}")
for i, edu in enumerate(parsed_edu.education, 1):
    print(f"\nEducation {i}:")
    print(f"  Degree: {edu.get('degree', 'N/A')}")
    print(f"  Institution: {edu.get('institution', 'N/A')}")
    print(f"  University: {edu.get('university', 'N/A')}")
    print(f"  Graduation Year: {edu.get('graduation_year', 'N/A')}")
    print(f"  Location: {edu.get('location', 'N/A')}")

# Test 4: Certifications extraction
print("\n" + "=" * 80)
print("TEST 4: Certifications Extraction")
print("=" * 80)
cert_text = """
CERTIFICATIONS

• PMP (Project Management Professional)
• Certified Scrum Master
• Microsoft Certified Solution Developer
• AWS Solutions Architect - Associate
"""

parsed_cert = parser._extract_structured_data(cert_text)
print(f"Certifications found: {len(parsed_cert.certifications)}")
for cert in parsed_cert.certifications:
    print(f"  - {cert}")

# Test 5: Languages extraction
print("\n" + "=" * 80)
print("TEST 5: Languages Extraction")
print("=" * 80)
lang_text = """
LANGUAGES

English (Fluent)
Hindi (Native)
Marathi (Professional)
"""

parsed_lang = parser._extract_structured_data(lang_text)
print(f"Languages found: {len(parsed_lang.languages)}")
for lang in parsed_lang.languages:
    print(f"  - {lang}")

# Test 6: Explicit experience years
print("\n" + "=" * 80)
print("TEST 6: Explicit Experience Years")
print("=" * 80)
explicit_exp_text = """
PROFESSIONAL SUMMARY

Senior Software Engineer with 27+ years of experience in enterprise software development,
cloud architecture, and team leadership.
"""

parsed_explicit = parser._extract_structured_data(explicit_exp_text)
print(f"Explicit years of experience: {parsed_explicit.years_of_experience}")

# Test 7: Name extraction
print("\n" + "=" * 80)
print("TEST 7: Name Extraction")
print("=" * 80)
name_text = """
John Michael Smith

Contact Information
Email: john.smith@email.com
Phone: +1-234-567-8901
"""

parsed_name = parser._extract_structured_data(name_text)
print(f"Extracted name: {parsed_name.name}")

# Test 8: Advanced Project Parsing with Proper Boundaries
print("\n" + "=" * 80)
print("TEST 8: Advanced Project Parsing - Multiple Projects with Boundaries")
print("=" * 80)
advanced_project_text = """
PROJECTS

AI-Driven Diagnostics For Health Innovation
Developed an intelligent health monitoring system using computer vision
• Implemented real-time health parameter detection
• Built predictive analytics using machine learning algorithms
• Created alerts using OpenCV and image processing
Technologies: Artificial Intelligence, Generative AI, OpenCV, Python, Machine Learning

JARVIS
https://github.com/user/jarvis
Developed a personal AI assistant with voice recognition
• Integrated Gemini API for natural language processing
• Built OCR functionality for document scanning
• Implemented RAG (Retrieval Augmented Generation)
Technologies: Python, Gemini API, OCR, RAG, Natural Language Processing

Quick Court - Gujarat, Gandhinagar
Link: https://quickcourt.vercel.app/
Currently developing an application to track student participation in NGO events
• Built Flask backend with user authentication
• Implemented real-time notifications
• Created dashboard for event management
Technologies: Flask, React, Node.js, MongoDB, JavaScript

Student-Faculty Ratio Application
Developed under the guidance of the HOD to support faculty requirement analysis
• Built data visualization components
• Integrated with university database systems
• Created automated reporting features
Technologies: Django, PostgreSQL, Python, Data Visualization

EDUCATION

Bachelor of Technology - Computer Science
"""

parsed_advanced = parser._extract_structured_data(advanced_project_text)
print(f"Total projects detected: {len(parsed_advanced.projects)}")
print()

expected_projects = ["AI-Driven Diagnostics For Health Innovation", "JARVIS", "Quick Court", "Student-Faculty Ratio Application"]

for i, proj in enumerate(parsed_advanced.projects, 1):
    print(f"PROJECT {i}:")
    print(f"  Title: {proj.get('title', 'N/A')}")
    print(f"  Link: {proj.get('project_link', 'N/A')}")
    
    # Show description as array (bullet points)
    desc = proj.get('description', [])
    if isinstance(desc, list) and desc:
        print(f"  Description ({len(desc)} points):")
        for j, point in enumerate(desc[:3], 1):  # Show first 3 points
            print(f"    {j}. {point}")
        if len(desc) > 3:
            print(f"    ... and {len(desc) - 3} more")
    elif desc:
        print(f"  Description: {str(desc)[:100]}...")
    else:
        print("  Description: N/A")
    
    techs = proj.get('technologies', [])
    print(f"  Technologies ({len(techs)}): {', '.join(techs[:5])}")
    if len(techs) > 5:
        print(f"    ... and {len(techs) - 5} more")
    
    print()

# Verify no content bleeding
print("VERIFICATION CHECKS:")
print("=" * 40)

# Check that projects are properly separated
if len(parsed_advanced.projects) >= 4:
    print("✓ Found expected number of projects (4)")
else:
    print(f"✗ Expected 4 projects, found {len(parsed_advanced.projects)}")

# Check specific project titles
found_titles = [proj.get('title', '') for proj in parsed_advanced.projects]
for expected in expected_projects:
    if any(expected.lower() in title.lower() for title in found_titles):
        print(f"✓ Found project: {expected}")
    else:
        print(f"✗ Missing project: {expected}")

# Check that JARVIS has GitHub link
jarvis_project = None
for proj in parsed_advanced.projects:
    if 'jarvis' in proj.get('title', '').lower():
        jarvis_project = proj
        break

if jarvis_project:
    if 'github.com' in jarvis_project.get('project_link', ''):
        print("✓ JARVIS has GitHub link")
    else:
        print(f"✗ JARVIS missing GitHub link: {jarvis_project.get('project_link', 'N/A')}")

# Check that Quick Court has location info or proper title
quick_court = None
for proj in parsed_advanced.projects:
    if 'quick court' in proj.get('title', '').lower():
        quick_court = proj
        break

if quick_court:
    if 'vercel.app' in quick_court.get('project_link', ''):
        print("✓ Quick Court has project link")
    else:
        print(f"✗ Quick Court missing project link: {quick_court.get('project_link', 'N/A')}")

print("\n" + "=" * 80)
print("ALL TESTS COMPLETED")
print("=" * 80)

