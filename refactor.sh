#!/bin/bash

# Define directories to process
TARGET_DIRS=("models" "controllers")

echo "Starting PascalCase Refactor..."

for dir in "${TARGET_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "Processing directory: $dir"
        
        # 1. Rename files from camelCase or other to PascalCase
        # This regex looks for files starting with lowercase and converts to Uppercase
        for file in "$dir"/*; do
            filename=$(basename "$file")
            first_char=${filename:0:1}
            
            # Check if first character is lowercase
            if [[ "$first_char" =~ [a-z] ]]; then
                new_name="$(tr '[:lower:]' '[:upper:]' <<< "${first_char:0:1}")${filename:1}"
                mv "$file" "$dir/$new_name"
                echo "Renamed: $filename -> $new_name"
                
                # 2. Update references in code
                # This finds all 'require' or 'import' statements and updates the path
                find . -type f -name "*.js" -exec sed -i "s|$filename|$new_name|g" {} +
            fi
        done
    fi
done

echo "Refactor Complete. Please run your test suite to ensure all imports are resolved."
