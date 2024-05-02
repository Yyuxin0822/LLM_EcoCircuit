import os
import json
import re
import random
import urllib
import openai 
import requests
import base64
from flaskr.config import OPENAI_API_KEY, GITHUB_TOKEN

openai.api_key = OPENAI_API_KEY
token=GITHUB_TOKEN

######################################################
######################################################
#Task 1 - Generate Environment Image
def genexpand(prompt):
    response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {
        "role": "system",
        "content": "You are to help me expand an environment description to exactly 100 words with specific imagination and sustainable infrastructure"
        },
        {
        "role": "user",
        "content": prompt,
        },
    ],
    temperature=1,
    max_tokens=256,
    top_p=1,
    frequency_penalty=0,
    presence_penalty=0
    )
    expanded_description = response['choices'][0]['message']['content']
    return expanded_description

def getcanvas(envir_description):
    response = openai.Image.create(
        model="dall-e-3",
        prompt=f"{envir_description}, photorealistic",
        n=1,
        size="1024x1024"
    )
    image_url = response['data'][0]['url']

    return image_url

def getdescription(image_url):  
    response = openai.ChatCompletion.create(
        model="gpt-4-vision-preview",
        messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What’s in this image? Provide me with a Dalle image description."},
            {
            "type": "image_url",
            "image_url": {
                "url": image_url,
            },
            },
        ],
        }
    ],
    max_tokens=300,
    )
    description = response.choices[0]['message']['content']
    return description

def genurl(id, local_path='../instance/images/envir.jpg', repo='images', owner='Yyuxin0822', token=GITHUB_TOKEN, branch='main'):
    """
    Upload or replace an image in GitHub with a specific ID as the filename.

    Args:
        id (int): Unique identifier for the image, used to rename the image.
        local_path (str): Path where the image is stored locally.
        repo (str): Repository name.
        owner (str): Owner of the repository.
        token (str): GitHub token for authentication.
        branch (str): Branch name where the file will be uploaded.

    Returns:
        str: Public URL of the uploaded/replaced image.
    """
    headers = {"Authorization": f"token {token}"}
    # The image is renamed to "{id}.jpg" for uploading
    path = f"{id}.jpg"
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    # Try to fetch the existing file to get its SHA (if it exists)
    sha = None
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        sha = response.json().get('sha')

    # Read and encode the image file
    with open(local_path, "rb") as image_file:
        base64_content = base64.b64encode(image_file.read()).decode()

    # Data payload for the PUT request, including the image content
    data = {
        "message": f"Upload/Replace image {path}",
        "committer": {
            "name": "Monalisa Octocat",
            "email": "octocat@github.com"
        },
        "content": base64_content,
        "branch": branch
    }

    # If updating (replacing) an existing file, include its SHA
    if sha:
        data['sha'] = sha

    # Make the PUT request to create or update the file
    response = requests.put(url, headers=headers, json=data)

    # Check the response
    if response.status_code in [200, 201]:  # Successfully created or updated
        print(f"Image {path} uploaded/replaced successfully.")
        publicURL = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
        return publicURL
    else:
        print(f"Failed to upload/replace the image {path}: {response.json()}")
        return None

if __name__ == '__main__':
    pass
    # url=genurl(1)
    # print(url)
    # print(getdescription(url))