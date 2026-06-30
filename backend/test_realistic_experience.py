"""Test with more realistic experience format matching the screenshot."""

from services.resume_parser import ResumeParser

def test_realistic_experience_format():
    """Test with the actual format that would appear in a real resume."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("REALISTIC EXPERIENCE FORMAT TEST")  
    print("=" * 80)
    
    # More realistic format based on actual resume structure
    test_text = """
EXPERIENCE

Worley Services Pvt. Ltd. — Technical Specialist 6.5 Years
• Led AWS cloud migration initiatives, improving scalability, availability, and cost efficiency.
• Developed Python-based solutions for secure data transfer.
• Designed integrations between ERM and EcoSys platforms for seamless data exchange using REST-based APIs and SOAP-based APIs.
• Worked in Agile teams to ensure timely delivery.

Accenture Services Pvt. Ltd. — Associate Manager 12 Years
• Managed multiple projects for Fortune 500 clients.
• Led teams of 10+ developers in application development.
• Implemented DevOps practices and CI/CD pipelines.
• Coordinated with stakeholders for project requirements.

EDUCATION
Bachelor of Technology - Computer Science
"""
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"RESULTS:")
    print(f"Experience entries: {len(parsed.experience)}")
    print()
    
    print("EXPERIENCE ANALYSIS:")
    for i, exp in enumerate(parsed.experience, 1):
        print(f"  {i}. Company: '{exp.get('company', 'N/A')}'")
        print(f"     Designation: '{exp.get('designation', 'N/A')}'")
        print(f"     Duration: '{exp.get('duration', 'N/A')}'")
        print(f"     Experience Years: {exp.get('experience_years', 0)}")
        print(f"     Responsibilities ({len(exp.get('responsibilities', []))} items):")
        for j, resp in enumerate(exp.get('responsibilities', []), 1):
            print(f"       {j}. {resp[:60]}...")
        print()
    
    print("VALIDATION:")
    print("=" * 40)
    
    # Should have exactly 2 experience entries
    count_check = len(parsed.experience) == 2
    print(f"{'✓' if count_check else '✗'} Expected 2 entries, got {len(parsed.experience)}")
    
    # Check Worley entry
    worley_exp = None
    for exp in parsed.experience:
        if 'worley' in exp.get('company', '').lower():
            worley_exp = exp
            break
    
    if worley_exp:
        print(f"✓ Worley Services found")
        print(f"  - Company: '{worley_exp.get('company')}'")
        print(f"  - Designation: '{worley_exp.get('designation')}'")
        print(f"  - Duration: '{worley_exp.get('duration')}'")
        print(f"  - Responsibilities: {len(worley_exp.get('responsibilities', []))}")
        
        # Check if all responsibilities are grouped under Worley
        responsibilities = worley_exp.get('responsibilities', [])
        has_aws = any('aws' in resp.lower() for resp in responsibilities)
        has_python = any('python' in resp.lower() for resp in responsibilities)
        has_integrations = any('integration' in resp.lower() for resp in responsibilities)
        has_agile = any('agile' in resp.lower() for resp in responsibilities)
        
        print(f"  - Has AWS responsibility: {'✓' if has_aws else '✗'}")
        print(f"  - Has Python responsibility: {'✓' if has_python else '✗'}")  
        print(f"  - Has Integration responsibility: {'✓' if has_integrations else '✗'}")
        print(f"  - Has Agile responsibility: {'✓' if has_agile else '✗'}")
        
        worley_complete = has_aws and has_python and has_integrations and has_agile
    else:
        print(f"✗ Worley Services not found")
        worley_complete = False
    
    # Check Accenture entry  
    accenture_exp = None
    for exp in parsed.experience:
        if 'accenture' in exp.get('company', '').lower():
            accenture_exp = exp
            break
    
    if accenture_exp:
        print(f"✓ Accenture Services found")
        print(f"  - Company: '{accenture_exp.get('company')}'")
        print(f"  - Designation: '{accenture_exp.get('designation')}'") 
        print(f"  - Duration: '{accenture_exp.get('duration')}'")
        print(f"  - Responsibilities: {len(accenture_exp.get('responsibilities', []))}")
        accenture_complete = len(accenture_exp.get('responsibilities', [])) > 0
    else:
        print(f"✗ Accenture Services not found")
        accenture_complete = False
    
    overall_success = count_check and worley_complete and accenture_complete
    
    print(f"\nOVERALL RESULT: {'🎉 SUCCESS - Experience parsing working correctly!' if overall_success else '❌ Still needs fixes'}")
    
    return overall_success

if __name__ == "__main__":
    print("Testing Realistic Experience Format\n")
    test_realistic_experience_format()