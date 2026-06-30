"""Comprehensive final test showing all the fixes working together."""

from services.resume_parser import ResumeParser

def test_comprehensive_fixes():
    """Test all the major fixes working together."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("COMPREHENSIVE FIXES TEST")
    print("=" * 80)
    print("Testing all major fixes:")
    print("1. Name extraction from complex layouts")
    print("2. Project boundary detection") 
    print("3. Experience section project extraction")
    print("4. Position header handling")
    print("5. URL extraction and preservation")
    print()
    
    # Comprehensive test combining all the issues
    test_text = """
Name                                                                                                            Achievements

Anvay_Uparkar                                                                                                   +91-9702017203
                                                                                                               anvayuparkar@gmail.com
Bachelor of Technology, Artificial Intelligence & Data Science [4th Year]
Shah & Anchor Kutchhi Engineering College, Chembur

PROJECTS

AI-Driven Diagnostics For Health Innovation [Mini-Project] - (Completed) - [Sem-VI]
https://neuro-care-ai.netlify.app/
Developed an intelligent health monitoring system using computer vision technology.

Activity-based diet recommendations using Google Fit / Health Connect and Gesture-based SOS emergency system with live routing and alerts using OpenCV
Uses Nominatim + Leaflet with OpenStreetMap for location tracking & hospital navigation

Quick Court
Currently developing an application to track student participation in NGO events.
https://quickcourt.vercel.app/

JARVIS Student-Faculty Ratio Application
Built under HOD guidance for faculty requirement analysis and automated reporting.
Technologies: Python, Django, PostgreSQL, Data Visualization

EXPERIENCE

Position

Worley Services Pvt. Ltd. — Technical Specialist 6.5 Years
• Led AWS cloud migration initiatives, improving scalability, availability, and cost efficiency.
• Developed Python-based solutions for secure data transfer.

Position

•Product Development Team-
– Developed a Student-Faculty Ratio Application under the guidance of the HOD to support faculty requirement analysis.
Link - https://st-ds-product-dev.vercel.app/login
– Currently developing an application to track student participation in NGO events for Agastya Foundation.

Position

Accenture Services Pvt. Ltd. — Associate Manager 12 Years
• Managed multiple projects for Fortune 500 clients.
• Led teams of 10+ developers in application development.

EDUCATION
Bachelor of Technology - Computer Science
University of Mumbai
2021 - 2025

SKILLS
Python, JavaScript, React, Node.js, AWS, Machine Learning, Django, PostgreSQL
"""
    
    print("PARSING COMPREHENSIVE RESUME...")
    parsed = parser._extract_structured_data(test_text)
    
    print(f"\n📋 SUMMARY RESULTS:")
    print(f"Name: '{parsed.name}'")
    print(f"Email: '{parsed.email}'")
    print(f"Phone: '{parsed.phone}'")
    print(f"Projects: {len(parsed.projects)}")
    print(f"Experience: {len(parsed.experience)}")
    print(f"Skills: {len(parsed.skills)}")
    print()
    
    print("🔍 DETAILED VERIFICATION:")
    print("=" * 40)
    
    # 1. Name extraction test
    name_correct = parsed.name == "Anvay Uparkar"
    print(f"1. {'✓' if name_correct else '✗'} Name extraction: '{parsed.name}'")
    
    # 2. Contact info test
    email_correct = parsed.email == "anvayuparkar@gmail.com"
    phone_correct = "+91-9702017203" in parsed.phone
    print(f"2. {'✓' if email_correct else '✗'} Email extraction: '{parsed.email}'")
    print(f"3. {'✓' if phone_correct else '✗'} Phone extraction: '{parsed.phone}'")
    
    # 4. Project boundary detection test
    expected_projects = ["AI-Driven Diagnostics For Health Innovation", "Activity-based diet recommendations", "Quick Court", "JARVIS Student-Faculty Ratio Application"]
    projects_found = []
    for proj in parsed.projects:
        title = proj.get('title', '')
        projects_found.append(title)
    
    boundary_correct = len(parsed.projects) >= 4
    print(f"4. {'✓' if boundary_correct else '✗'} Project boundary detection: {len(parsed.projects)} projects found")
    
    # 5. URL extraction test
    project_urls = [proj.get('project_link', '') for proj in parsed.projects if proj.get('project_link')]
    has_neuro_url = any('neuro-care-ai.netlify.app' in url for url in project_urls)
    has_quickcourt_url = any('quickcourt.vercel.app' in url for url in project_urls)
    has_student_faculty_url = any('st-ds-product-dev.vercel.app' in url for url in project_urls)
    
    url_extraction_correct = has_neuro_url and has_quickcourt_url and has_student_faculty_url
    print(f"5. {'✓' if url_extraction_correct else '✗'} URL extraction: {len(project_urls)} URLs found")
    
    # 6. Experience parsing test  
    experience_companies = [exp.get('company', '') for exp in parsed.experience]
    has_worley = any('worley' in comp.lower() for comp in experience_companies)
    has_product_dev = any('product development team' in comp.lower() for comp in experience_companies)
    has_accenture = any('accenture' in comp.lower() for comp in experience_companies)
    no_position_entries = not any('position' == comp.lower() for comp in experience_companies)
    
    experience_correct = has_worley and has_product_dev and has_accenture and no_position_entries
    print(f"6. {'✓' if experience_correct else '✗'} Experience parsing: {len(parsed.experience)} entries, no 'Position' companies")
    
    # 7. Experience projects test (projects extracted from experience)
    exp_projects_found = len([proj for proj in parsed.projects if 'student-faculty' in proj.get('title', '').lower() or 'ngo' in proj.get('title', '').lower()])
    exp_projects_correct = exp_projects_found >= 2
    print(f"7. {'✓' if exp_projects_correct else '✗'} Experience projects: {exp_projects_found} projects extracted from experience")
    
    # 8. Skills extraction test
    skills_correct = len(parsed.skills) >= 5
    print(f"8. {'✓' if skills_correct else '✗'} Skills extraction: {len(parsed.skills)} skills found")
    
    # Overall success
    all_tests = [name_correct, email_correct, phone_correct, boundary_correct, url_extraction_correct, 
                experience_correct, exp_projects_correct, skills_correct]
    overall_success = all(all_tests)
    
    print(f"\n🎯 OVERALL RESULT: {'🎉 ALL FIXES WORKING PERFECTLY!' if overall_success else '❌ Some issues remain'}")
    
    if overall_success:
        print(f"\n✅ FIXES CONFIRMED:")
        print(f"   • Name extraction from complex layouts ✓")
        print(f"   • Project boundary detection ✓") 
        print(f"   • Experience section project extraction ✓")
        print(f"   • Position header handling ✓")
        print(f"   • URL extraction and preservation ✓")
        print(f"   • Contact info parsing ✓")
        print(f"   • Skills extraction ✓")
    else:
        print(f"\n📋 DETAILED PROJECT LIST:")
        for i, proj in enumerate(parsed.projects, 1):
            print(f"   {i}. {proj.get('title', 'N/A')} | URL: {proj.get('project_link', 'None')}")
        
        print(f"\n📋 DETAILED EXPERIENCE LIST:")
        for i, exp in enumerate(parsed.experience, 1):
            print(f"   {i}. {exp.get('company', 'N/A')} - {exp.get('designation', 'N/A')}")
    
    return overall_success

if __name__ == "__main__":
    print("Testing All Comprehensive Fixes\n")
    test_comprehensive_fixes()