import json
import os
import sys

import google.generativeai as genai


def translate_code(source_language, target_language, source_text):
    genai.configure(api_key=os.environ['API_KEY'])
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f'Translate the following {source_language} code to {target_language}:\n\n{source_text}'
    response = model.generate_content(prompt)
    return response.text


if __name__ == '__main__':
    print('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaayyyyyyyyyyyyyyyyyyyyyyy')
    source_language = sys.argv[1]
    target_language = sys.argv[2]
    source_text = sys.argv[3]
    translated_text = translate_code(source_language, target_language, source_text)
    print(json.dumps({'original_text:', source_text}))
    print(json.dumps({'translated_text': translated_text}))
