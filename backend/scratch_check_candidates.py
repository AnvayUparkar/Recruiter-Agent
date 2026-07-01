import requests

# 1. Get a job ID
res = requests.get("http://localhost:5000/api/v1/jobs")
jobs = res.json().get("data", [])
if not jobs:
    print("No jobs found")
    exit()

job_id = jobs[0]["_id"]
print(f"Job ID: {job_id}")

# 2. Get candidates
res = requests.get(f"http://localhost:5000/api/v1/jobs/{job_id}/candidates")
print(res.json())
