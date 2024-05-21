import os
import json
import re
import random
import urllib
from openai import OpenAI
from instance.config import OPENAI_API_KEY, GITHUB_TOKEN
client = OpenAI(api_key=OPENAI_API_KEY)
import requests
import base64

from PIL import Image

token=GITHUB_TOKEN

######################################################
######################################################
#Task 1 - Generate Environment Image
def genexpand(prompt):
    try:
        response =  client.chat.completions.create(
        model="gpt-4-turbo",
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
        expanded_description = response.choices[0].message.content
        return expanded_description
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def getcanvas(envir_description, max_tries=3):
    for _ in range(max_tries):
        try:
            response = client.images.generate(
                model="dall-e-3",
                prompt=f"{envir_description}, photorealistic",
                n=1,
                size="1024x1024"
            )
            image_url = response.data[0].url
            # logging.debug(f"Image URL: {image_url}")
            return image_url
        except Exception as e:
            print(f"An error occurred: {e}")
    return None

def encode_image(image_path='../instance/images/envir.jpg'):
  with open(image_path, "rb") as image_file:
    return base64.b64encode(image_file.read()).decode('utf-8')

def getdescription(base64_image, max_tries=3):  
    for i in range(max_tries):
        try:
            response =  client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "What’s in this image? Provide me with a Dalle image description."},
                    {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    },
                    },
                ],
                } ],
            n=i+1,
            max_tokens=300,
            )
            description = response.choices[0].message.content
            # if description starts with "Sorry"
            if description.startswith("Sorry"):
                raise Exception(description)
            else:
                return description
        except Exception as e:
            print(f"An error occurred: {e}")
    return None


def cropImage(localpath: str = '../instance/images/envir.jpg', size: int = 720):
    try:
        # Open the image file
        img = Image.open(localpath)
        
        # Get the dimensions of the image
        width, height = img.size
        
        # Calculate the cropping dimensions
        if width > height:
            left = int((width - height) / 2)
            top = 0
            right = int((width + height) / 2)
            bottom = height
        else:
            left = 0
            top = int((height - width) / 2)
            right = width
            bottom = int((height + width) / 2)
        
        # Crop the image
        img_cropped = img.crop((left, top, right, bottom))
        
        # Resize the image
        img_resized = img_cropped.resize((size, size), Image.LANCZOS)
        
        # Save the cropped and resized image
        img_resized.save(localpath)
        
        print("Image cropped and resized successfully!")
        
    except Exception as e:
        print(f"An error occurred: {e}")


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
    print(response)
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