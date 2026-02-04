import sys
import importlib
from pathlib import Path

def check_module(name):
    try:
        importlib.import_module(name)
        print(f"✅ {name}: Installed")
    except ImportError:
        print(f"❌ {name}: Missing")

def check_env_file():
    if Path(".env").exists():
        print("✅ .env file: Exists")
    else:
        print("❌ .env file: Missing")

def check_directories():
    from dotenv import load_dotenv
    import os
    load_dotenv()
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    path = Path(upload_dir)
    if not path.exists():
        try:
            path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Upload directory created: {upload_dir}")
        except Exception as e:
            print(f"❌ Failed to create upload directory: {e}")
    else:
        print(f"✅ Upload directory exists: {upload_dir}")

def main():
    print("--- Checking Music Management System Environment ---")
    print(f"Python Version: {sys.version.split()[0]}")
    
    required_modules = [
        "fastapi", "sqlalchemy", "alembic", "pydantic", 
        "mutagen", "PIL", "aiofiles", "multipart"
    ]
    
    for mod in required_modules:
        check_module(mod)
        
    check_env_file()
    check_directories()
    print("--- Environment Check Complete ---")

if __name__ == "__main__":
    main()
