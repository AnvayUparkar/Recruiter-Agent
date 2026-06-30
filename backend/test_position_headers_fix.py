"""Test for handling Position headers correctly in experience section."""

from services.resume_parser import ResumeParser

def test_position_headers_handling():
    """Test proper handling of Position headers that should be ignored."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("POSITION HEADERS HANDLING TEST")  
    print("=" * 80)
    print("Testing proper handling of 'Position' headers that should be ignored as section dividers")
    print()
    
    # Format with Position headers (like in your screenshot)
    test_text = """
EXPERIENCE

Position

Worley Services Pvt. Ltd. — Technical Specialist 6.5 Years
• Led AWS cloud migration initiatives, improving scalability, availability, and cost efficiency.
• Developed Python-based solutions for secure data transfer.
• Designed integrations between ERM and EcoSys platforms for seamless data exchange using REST-based APIs and SOAP-based APIs.
• Worked in Agile teams to ensure timely delivery.

Position

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
        for j, resp in enumerate(exp.get('responsibilities', [])[:3], 1):
            print(f"       {j}. {resp[:60]}...")
        if len(exp.get('responsibilities', [])) > 3:
            print(f"       ... and {len(exp.get('responsibilities', [])) - 3} more")
        print()
    
    print("VALIDATION:")
    print("=" * 40)
    
    # Should have exactly 2 experience entries (Position headers should be ignored)
    count_check = len(parsed.experience) == 2
    print(f"{'✓' if count_check else '✗'} Expected 2 entries, got {len(parsed.experience)}")
    
    # Check that no entry has "Position" as company name
    position_entries = [exp for exp in parsed.experience if exp.get('company', '').lower() == 'position']
    no_position_companies = len(position_entries) == 0
    print(f"{'✓' if no_position_companies else '✗'} No 'Position' entries as companies: {no_position_companies}")
    
    # Check that we have the correct companies
    companies = [exp.get('company', '') for exp in parsed.experience]
    has_worley = any('worley' in company.lower() for company in companies)
    has_accenture = any('accenture' in company.lower() for company in companies)
    
    print(f"{'✓' if has_worley else '✗'} Worley Services found: {has_worley}")
    print(f"{'✓' if has_accenture else '✗'} Accenture Services found: {has_accenture}")
    
    # Check that responsibilities are properly grouped
    worley_exp = None
    for exp in parsed.experience:
        if 'worley' in exp.get('company', '').lower():
            worley_exp = exp
            break
    
    worley_responsibilities_ok = False
    if worley_exp:
        responsibilities = worley_exp.get('responsibilities', [])
        has_aws = any('aws' in resp.lower() for resp in responsibilities)
        has_python = any('python' in resp.lower() for resp in responsibilities)
        worley_responsibilities_ok = has_aws and has_python and len(responsibilities) >= 3
    
    print(f"{'✓' if worley_responsibilities_ok else '✗'} Worley has proper responsibilities: {worley_responsibilities_ok}")
    
    overall_success = (count_check and no_position_companies and has_worley and 
                      has_accenture and worley_responsibilities_ok)
    
    print(f"\nOVERALL RESULT: {'🎉 SUCCESS - Position headers handled correctly!' if overall_success else '❌ Still needs fixes'}")
    
    if not overall_success:
        print(f"\nDEBUG INFO:")
        print(f"Found companies: {companies}")
        if position_entries:
            print(f"Position entries found: {[exp.get('company') for exp in position_entries]}")
    
    return overall_success

if __name__ == "__main__":
    print("Testing Position Headers Handling\n")
    test_position_headers_handling()