import requests
import re
import urllib.request
import os

url = 'https://data.mendeley.com/datasets/RVRT4ZS969/1'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
html = requests.get(url, headers=headers).text

print('Fetched HTML, length:', len(html))

# Mendeley stores the dataset files in a script tag or state object.
# Let's just find any .zip link in the page if possible, or use the Mendeley API.
# Wait, Mendeley data API for a dataset:
api_url = "https://data.mendeley.com/public-api/datasets/RVRT4ZS969/versions/1"
try:
    data = requests.get(api_url, headers=headers).json()
    files = data.get('files', [])
    for f in files:
        print("Found file:", f['filename'], "URL:", f['content_details']['download_url'])
        if f['filename'].endswith('.zip'):
            d_url = f['content_details']['download_url']
            print("Downloading from", d_url)
            urllib.request.urlretrieve(d_url, f['filename'])
            print("Successfully downloaded", f['filename'])
            break
except Exception as e:
    print("API failed, checking HTML...")
    # Find something like contentUrl
    match = re.search(r'"contentUrl":"(https://[^"]+\.zip[^"]*)"', html)
    if match:
        download_url = match.group(1).replace('\\u002F', '/')
        print('Found URL via HTML:', download_url)
        urllib.request.urlretrieve(download_url, "LoserSalmonDataset.zip")
        print("Successfully downloaded LoserSalmonDataset.zip")
    else:
        print("Could not find download URL")
