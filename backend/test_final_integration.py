"""Final integration test to ensure all fixes work together."""

from services.resume_parser import ResumeParser

def test_final_integration():
    """Test that all fixes work together without conflicts."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("FINAL INTEGRATION TEST")
    print("=" * 80)
    print("Testing comprehensive resume with all previous issue types")
    print()
    
    # Comprehensive test resume that includes all previously fixed issues
    test_resume = """
Name        Achievements
Anvay_Uparkar               Best Student Award 2023

CONTACT
Email: anvayuparkar@gmail.com
Phone: +91-9702017203

EXPERIENCE

Position

Technical Specialist
Worley Services Pvt. Ltd.
6.5 Years
• Led AWS cloud migration initiatives, improving scalability, availability, and cost efficiency.

based solutions for secure data transfer.
Developed Python
• Designed integrations between ERM and EcoSys platforms for seamless data exchange using REST-based APIs and SOAP-based APIs.
• Worked in Agile teams to ensure timely delivery.

Associate Manager  
Accenture Services Pvt. Ltd.
12 Years

quality solutions aligned with business requirements.
Delivered custom software development projects for U.S. clients, ensuring high
• Led cross-functional teams of 15+ members, driving successful project execution and maintaining high client satisfaction.
• Implemented Agile/Scrum methodologies, improving team productivity and reducing project delivery timelines.

PROJECTS

•AI-Driven Diagnostics For Health Innovation 
Description: Developed an innovative AI-based platform for early disease detection using machine learning algorithms.
Technologies: Python, TensorFlow, React.js, Node.js
Link: https://neuro-care-ai.netlify.app/

Quick Court
Description: A comprehensive court management system streamlining legal processes and case tracking.
Technologies: Java, Spring Boot, MySQL, Angular

JARVIS Student-Faculty Ratio Application [Sem-VI]  
Description: Developed a web application to optimize student-faculty ratios and course scheduling.
Technologies: Python, Django, PostgreSQL

EDUCATION
Bachelor of Technology
Computer Science Engineering
XYZ University
2020

SKILLS
Python, Java, JavaScript, React.js, Node.js, TensorFlow, AWS, Docker, Kubernetes, MySQL, PostgreSQL, Git
"""
    
    # Parse the resume
    parsed = parser._extract_structured_data(test_resume)
    
    print("🔍 INTEGRATION TEST RESULTS:")
    print("=" * 40)
    
    # Check all key areas
    issues_found = []
    
    # 1. Name extraction  
    if parsed.name != "Anvay Uparkar":
        issues_found.append(f"❌ Name: Expected 'Anvay Uparkar', got '{parsed.name}'")
    else:
        print("✅ Name extraction: 'Anvay Uparkar'")
    
    # 2. Contact info
    if parsed.email != "anvayuparkar@gmail.com":
        issues_found.append(f"❌ Email: Expected 'anvayuparkar@gmail.com', got '{parsed.email}'")
    else:
        print("✅ Email extraction: 'anvayuparkar@gmail.com'")
    
    # 3. Experience entries (should be exactly 2, not fragmented)
    if len(parsed.experience) != 2:
        issues_found.append(f"❌ Experience count: Expected 2, got {len(parsed.experience)}")
    else:
        print(f"✅ Experience entries: {len(parsed.experience)} (not fragmented)")
    
    # 4. Check experience companies (no "Position" entries)
    exp_companies = [exp.get('company', '') for exp in parsed.experience]
    if 'Position' in exp_companies:
        issues_found.append("❌ 'Position' found in companies (should be filtered)")
    else:
        print("✅ No 'Position' header companies found")
    
    # 5. Check for proper designations
    exp_designations = [exp.get('designation', '') for exp in parsed.experience]
    expected_designations = ['Technical Specialist', 'Associate Manager']
    for exp_des in expected_designations:
        if exp_des not in exp_designations:
            issues_found.append(f"❌ Missing designation: '{exp_des}'")
    
    if not any(issues_found for d in expected_designations):
        print("✅ All expected designations found")
    
    # 6. Project boundary detection (should detect all 3 projects separately)
    if len(parsed.projects) < 3:
        issues_found.append(f"❌ Project count: Expected at least 3, got {len(parsed.projects)}")
    else:
        print(f"✅ Project boundary detection: {len(parsed.projects)} projects found")
    
    # 7. Check specific projects are detected
    project_titles = [p.get('title', '') for p in parsed.projects]
    expected_projects = ['AI-Driven Diagnostics For Health Innovation', 'Quick Court', 'JARVIS Student-Faculty Ratio Application']
    
    for proj_title in expected_projects:
        if not any(proj_title in title for title in project_titles):
            issues_found.append(f"❌ Missing project: '{proj_title}'")
    
    if not any(issues_found for p in expected_projects):
        print("✅ All expected projects detected")
    
    # 8. URL extraction
    project_urls = [p.get('link', '') for p in parsed.projects]
    expected_url = 'https://neuro-care-ai.netlify.app/'
    
    if not any(expected_url in url for url in project_urls):
        issues_found.append(f"❌ Missing project URL: '{expected_url}'")
    else:
        print("✅ Project URLs extracted properly")
    
    # 9. Experience responsibilities quality check
    total_responsibilities = sum(len(exp.get('responsibilities', [])) for exp in parsed.experience)
    if total_responsibilities < 5:  # Should have decent number of responsibilities
        issues_found.append(f"❌ Too few responsibilities: {total_responsibilities}")
    else:
        print(f"✅ Responsibilities extracted: {total_responsibilities} total")
    
    # Final result
    print("\n" + "=" * 40)
    if issues_found:
        print("❌ INTEGRATION TEST FAILED")
        print("\nISSUES FOUND:")
        for issue in issues_found:
            print(f"  {issue}")
    else:
        print("🎉 INTEGRATION TEST PASSED!")
        print("All previous fixes are working together perfectly!")
    
    return len(issues_found) == 0

if __name__ == "__main__":
    test_final_integration()