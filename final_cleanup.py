import os
import shutil

# Move remaining Symbols_and_Rituals content
source = r"C:\Code\Frenchtown_Revolution\Symbols_and_Rituals"
dest = r"C:\Code\Frenchtown_Revolution\Frenchtown_Revolution\Deep Research\Symbols and Rituals"

subfolder_mapping = {
    "Festival_Organization": "Public Festivals",
    "Revolutionary_Calendar": "Ceremony Design",
    "Revolutionary_Symbols": "Revolutionary Symbols"
}

for source_sub, dest_sub in subfolder_mapping.items():
    source_path = os.path.join(source, source_sub)
    dest_path = os.path.join(dest, dest_sub)
    
    if os.path.exists(source_path):
        os.makedirs(dest_path, exist_ok=True)
        
        for file in os.listdir(source_path):
            if file.endswith('.md'):
                source_file = os.path.join(source_path, file)
                dest_file = os.path.join(dest_path, file)
                
                # Check if file already exists at destination
                if not os.path.exists(dest_file):
                    try:
                        shutil.move(source_file, dest_file)
                        print(f"Moved: {file} to {dest_sub}")
                    except Exception as e:
                        print(f"Error moving {file}: {e}")
                else:
                    print(f"File already exists: {file} in {dest_sub}")

# Clean up empty directories
for root, dirs, files in os.walk(source, topdown=False):
    if not files and not dirs:
        try:
            os.rmdir(root)
            print(f"Removed empty directory: {root}")
        except:
            pass

# Remove the source folder if empty
try:
    os.rmdir(source)
    print("Removed main source folder")
except:
    print("Could not remove main folder - may contain files")

# Clean up the temporary scripts
try:
    os.remove(r"C:\Code\Frenchtown_Revolution\merge_research.py")
    os.remove(r"C:\Code\Frenchtown_Revolution\complete_merge.py")
    print("Cleaned up temporary scripts")
except:
    pass

print("\nFinal cleanup complete!")
