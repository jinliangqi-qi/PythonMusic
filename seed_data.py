import asyncio
import random
from datetime import datetime, date

from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal
from app.models.singer import Singer
from app.models.album import Album
from app.models.music import Music
from app.models.category import Category
from app.models.tag import Tag

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("--- Start seeding data ---")
        
        # 1. Clean up existing data (optional, be careful in production)
        # print("Cleaning up old data...")
        # await db.execute(delete(Music))
        # await db.execute(delete(Album))
        # await db.execute(delete(Singer))
        # await db.execute(delete(Category))
        # await db.execute(delete(Tag))
        # await db.commit()

        # 2. Create Singers
        print("Creating Singers...")
        singers_data = [
            {"name": "周杰伦", "gender": "male", "region": "China", "bio": "华语流行乐坛天王"},
            {"name": "陈奕迅", "gender": "male", "region": "HongKong", "bio": "K歌之王"},
            {"name": "Taylor Swift", "gender": "female", "region": "Europe_America", "bio": "美国流行天后"},
            {"name": "邓紫棋", "gender": "female", "region": "HongKong", "bio": "铁肺小天后"},
            {"name": "五月天", "gender": "band", "region": "Taiwan", "bio": "亚洲第一天团"},
        ]
        
        singers = []
        for s in singers_data:
            # Check if exists
            stmt = select(Singer).where(Singer.name == s["name"])
            existing = await db.scalar(stmt)
            if not existing:
                singer = Singer(
                    name=s["name"], 
                    gender=s["gender"],
                    # region is not in model, maybe I misread or it was removed? 
                    # checking model file... Singer model has no region column in the file I read.
                    # Wait, let me double check Singer model.
                    # Line 10: gender... Line 11: bio... Line 12: avatar... Line 13: debut_date...
                    # No region column. I will skip region.
                    bio=s["bio"],
                    debut_date=date(2000, 1, 1)
                )
                db.add(singer)
                singers.append(singer)
            else:
                singers.append(existing)
        await db.commit()
        # Refresh to get IDs
        for s in singers:
            await db.refresh(s)

        # 3. Create Albums
        print("Creating Albums...")
        albums_data = [
            {"title": "范特西", "singer": singers[0], "year": 2001},
            {"title": "最伟大的作品", "singer": singers[0], "year": 2022},
            {"title": "U87", "singer": singers[1], "year": 2005},
            {"title": "1989", "singer": singers[2], "year": 2014},
        ]
        
        albums = []
        for a in albums_data:
            stmt = select(Album).where(Album.title == a["title"])
            existing = await db.scalar(stmt)
            if not existing:
                album = Album(
                    title=a["title"],
                    singer_id=a["singer"].id,
                    release_date=date(a["year"], 1, 1),
                    description=f"{a['singer'].name} 的经典专辑"
                )
                db.add(album)
                albums.append(album)
            else:
                albums.append(existing)
        await db.commit()
        for a in albums:
            await db.refresh(a)

        # 4. Create Categories
        print("Creating Categories...")
        cats_data = ["流行", "摇滚", "民谣", "电子", "古典"]
        for c_name in cats_data:
            stmt = select(Category).where(Category.name == c_name)
            if not await db.scalar(stmt):
                db.add(Category(name=c_name))
        await db.commit()

        # 5. Create Tags
        print("Creating Tags...")
        tags_data = ["伤感", "快乐", "驾车", "运动", "放松", "经典"]
        tags = []
        for t_name in tags_data:
            stmt = select(Tag).where(Tag.name == t_name)
            existing = await db.scalar(stmt)
            if not existing:
                tag = Tag(name=t_name)
                db.add(tag)
                tags.append(tag)
            else:
                tags.append(existing)
        await db.commit()
        for t in tags:
            await db.refresh(t)

        # 6. Create Musics
        print("Creating Musics...")
        # Make sure we have enough data
        if not singers or not albums:
            print("Not enough singers or albums to create musics")
            return

        musics_data = [
            {"title": "爱在西元前", "singer": singers[0], "album": albums[0], "status": "active"},
            {"title": "简单爱", "singer": singers[0], "album": albums[0], "status": "active"},
            {"title": "还在流浪", "singer": singers[0], "album": albums[1], "status": "pending"},
            {"title": "浮夸", "singer": singers[1], "album": albums[2], "status": "active"},
            {"title": "Shake It Off", "singer": singers[2], "album": albums[3], "status": "active"},
            {"title": "泡沫", "singer": singers[3], "album": None, "status": "active"}, # Single
            {"title": "倔强", "singer": singers[4], "album": None, "status": "active"},
            {"title": "待审核歌曲1", "singer": singers[0], "album": None, "status": "pending"},
            {"title": "待审核歌曲2", "singer": singers[1], "album": None, "status": "pending"},
            {"title": "被驳回歌曲", "singer": singers[2], "album": None, "status": "rejected"},
        ]

        for m in musics_data:
            stmt = select(Music).where(Music.title == m["title"])
            if not await db.scalar(stmt):
                music = Music(
                    title=m["title"],
                    singer_id=m["singer"].id,
                    album_id=m["album"].id if m["album"] else None,
                    status=m["status"],
                    file_path=f"audio/demo_{random.randint(1,5)}.mp3", # Mock path
                    duration=random.randint(180, 300),
                    play_count=random.randint(0, 10000)
                )
                # Randomly assign tags
                # music.tags = random.sample(tags, k=random.randint(1, 3)) 
                # Note: Many-to-many direct assignment might need async handling or specific session management
                # For simplicity, we skip tag association here or handle it if relationship is loaded
                
                db.add(music)
        
        await db.commit()
        
        print("--- Data seeding completed ---")

if __name__ == "__main__":
    asyncio.run(seed_data())
