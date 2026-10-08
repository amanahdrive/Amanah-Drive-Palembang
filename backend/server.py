from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
PaketType = Literal["Mobil Manual", "Mobil Matic", "Motor"]
StudentStatus = Literal["aktif", "on_progress", "selesai"]
TransactionType = Literal["masuk", "keluar"]


class Package(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    harga: int
    total_pertemuan: int
    deskripsi: str = ""


class StudentCreate(BaseModel):
    nama: str
    telepon: str
    paket: str
    instruktur: Optional[str] = ""
    total_pertemuan: int = 10
    pertemuan_selesai: int = 0
    tanggal_daftar: Optional[str] = None
    status: StudentStatus = "aktif"
    harga_paket: int = 0
    catatan: Optional[str] = ""


class Student(StudentCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class StudentUpdate(BaseModel):
    nama: Optional[str] = None
    telepon: Optional[str] = None
    paket: Optional[str] = None
    instruktur: Optional[str] = None
    total_pertemuan: Optional[int] = None
    pertemuan_selesai: Optional[int] = None
    tanggal_daftar: Optional[str] = None
    status: Optional[StudentStatus] = None
    harga_paket: Optional[int] = None
    catatan: Optional[str] = None


class TransactionCreate(BaseModel):
    jenis: TransactionType
    kategori: str
    jumlah: int
    keterangan: Optional[str] = ""
    tanggal: Optional[str] = None
    siswa_id: Optional[str] = None
    siswa_nama: Optional[str] = None


class Transaction(TransactionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


class TransactionUpdate(BaseModel):
    jenis: Optional[TransactionType] = None
    kategori: Optional[str] = None
    jumlah: Optional[int] = None
    keterangan: Optional[str] = None
    tanggal: Optional[str] = None
    siswa_id: Optional[str] = None
    siswa_nama: Optional[str] = None


class DashboardSummary(BaseModel):
    total_siswa: int
    siswa_aktif: int
    siswa_on_progress: int
    siswa_selesai: int
    kas_masuk_bulan: int
    kas_keluar_bulan: int
    sisa_kas: int
    kas_masuk_total: int
    kas_keluar_total: int
    chart_7hari: List[dict]


DEFAULT_PACKAGES = [
    {"id": "paket-mobil-manual", "nama": "Mobil Manual", "harga": 1500000, "total_pertemuan": 10,
     "deskripsi": "Paket kursus mobil manual 10x pertemuan"},
    {"id": "paket-mobil-matic", "nama": "Mobil Matic", "harga": 1400000, "total_pertemuan": 8,
     "deskripsi": "Paket kursus mobil matic 8x pertemuan"},
    {"id": "paket-motor", "nama": "Motor", "harga": 500000, "total_pertemuan": 6,
     "deskripsi": "Paket kursus motor 6x pertemuan"},
]

INCOME_CATEGORIES = ["Pembayaran Kursus", "Pendaftaran", "Lainnya"]
EXPENSE_CATEGORIES = ["Gaji Instruktur", "BBM", "Maintenance Kendaraan", "Operasional", "Lainnya"]


# ---------- Startup: seed packages ----------
@app.on_event("startup")
async def seed_packages():
    for p in DEFAULT_PACKAGES:
        existing = await db.packages.find_one({"id": p["id"]})
        if not existing:
            await db.packages.insert_one(p.copy())


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Amanah Drive API", "version": "1.0"}


# Packages
@api_router.get("/packages", response_model=List[Package])
async def list_packages():
    rows = await db.packages.find({}, {"_id": 0}).to_list(100)
    return [Package(**r) for r in rows]


# Categories
@api_router.get("/categories")
async def list_categories():
    return {"masuk": INCOME_CATEGORIES, "keluar": EXPENSE_CATEGORIES}


# Students
@api_router.get("/students", response_model=List[Student])
async def list_students(status: Optional[str] = None):
    query = {"deleted_at": {"$exists": False}}
    if status and status != "semua":
        query["status"] = status
    rows = await db.students.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Student(**r) for r in rows]


@api_router.post("/students", response_model=Student)
async def create_student(payload: StudentCreate):
    data = payload.dict()
    if not data.get("tanggal_daftar"):
        data["tanggal_daftar"] = now_iso()
    student = Student(**data)
    doc = student.dict()
    await db.students.insert_one(doc.copy())
    return student


@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    row = await db.students.find_one({"id": student_id, "deleted_at": {"$exists": False}}, {"_id": 0})
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    return Student(**row)


@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, payload: StudentUpdate):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = now_iso()
    # Auto status based on progress
    if "pertemuan_selesai" in updates or "total_pertemuan" in updates:
        existing = await db.students.find_one({"id": student_id}, {"_id": 0})
        if existing:
            selesai = updates.get("pertemuan_selesai", existing.get("pertemuan_selesai", 0))
            total = updates.get("total_pertemuan", existing.get("total_pertemuan", 0))
            if selesai >= total and total > 0:
                updates["status"] = "selesai"
            elif selesai > 0:
                updates["status"] = "on_progress"
    result = await db.students.update_one({"id": student_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    row = await db.students.find_one({"id": student_id}, {"_id": 0})
    return Student(**row)


@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    result = await db.students.update_one(
        {"id": student_id},
        {"$set": {"deleted_at": now_iso()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"ok": True}


# Transactions
@api_router.get("/transactions", response_model=List[Transaction])
async def list_transactions(jenis: Optional[str] = None, bulan_ini: Optional[bool] = False):
    query = {"deleted_at": {"$exists": False}}
    if jenis and jenis != "semua":
        query["jenis"] = jenis
    if bulan_ini:
        now = datetime.now(timezone.utc)
        start = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()
        query["tanggal"] = {"$gte": start}
    rows = await db.transactions.find(query, {"_id": 0}).sort("tanggal", -1).to_list(2000)
    return [Transaction(**r) for r in rows]


@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(payload: TransactionCreate):
    data = payload.dict()
    if not data.get("tanggal"):
        data["tanggal"] = now_iso()
    tx = Transaction(**data)
    await db.transactions.insert_one(tx.dict())
    return tx


@api_router.get("/transactions/{tx_id}", response_model=Transaction)
async def get_transaction(tx_id: str):
    row = await db.transactions.find_one({"id": tx_id, "deleted_at": {"$exists": False}}, {"_id": 0})
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Transaction(**row)


@api_router.put("/transactions/{tx_id}", response_model=Transaction)
async def update_transaction(tx_id: str, payload: TransactionUpdate):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.transactions.update_one({"id": tx_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    row = await db.transactions.find_one({"id": tx_id}, {"_id": 0})
    return Transaction(**row)


@api_router.delete("/transactions/{tx_id}")
async def delete_transaction(tx_id: str):
    result = await db.transactions.update_one(
        {"id": tx_id},
        {"$set": {"deleted_at": now_iso()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"ok": True}


# Dashboard
@api_router.get("/dashboard", response_model=DashboardSummary)
async def dashboard():
    students = await db.students.find({"deleted_at": {"$exists": False}}, {"_id": 0}).to_list(5000)
    txs = await db.transactions.find({"deleted_at": {"$exists": False}}, {"_id": 0}).to_list(10000)

    total_siswa = len(students)
    siswa_aktif = sum(1 for s in students if s.get("status") == "aktif")
    siswa_on_progress = sum(1 for s in students if s.get("status") == "on_progress")
    siswa_selesai = sum(1 for s in students if s.get("status") == "selesai")

    kas_masuk_total = sum(t.get("jumlah", 0) for t in txs if t.get("jenis") == "masuk")
    kas_keluar_total = sum(t.get("jumlah", 0) for t in txs if t.get("jenis") == "keluar")
    sisa_kas = kas_masuk_total - kas_keluar_total

    now = datetime.now(timezone.utc)
    start_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    kas_masuk_bulan = 0
    kas_keluar_bulan = 0
    for t in txs:
        try:
            tgl = datetime.fromisoformat(t.get("tanggal", "").replace("Z", "+00:00"))
            if tgl.tzinfo is None:
                tgl = tgl.replace(tzinfo=timezone.utc)
            if tgl >= start_month:
                if t.get("jenis") == "masuk":
                    kas_masuk_bulan += t.get("jumlah", 0)
                else:
                    kas_keluar_bulan += t.get("jumlah", 0)
        except Exception:
            continue

    # Last 7 days chart
    from datetime import timedelta
    chart = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        next_day = day + timedelta(days=1)
        masuk = 0
        keluar = 0
        for t in txs:
            try:
                tgl = datetime.fromisoformat(t.get("tanggal", "").replace("Z", "+00:00"))
                if tgl.tzinfo is None:
                    tgl = tgl.replace(tzinfo=timezone.utc)
                if day <= tgl < next_day:
                    if t.get("jenis") == "masuk":
                        masuk += t.get("jumlah", 0)
                    else:
                        keluar += t.get("jumlah", 0)
            except Exception:
                continue
        chart.append({"tanggal": day.isoformat(), "label": day.strftime("%a"), "masuk": masuk, "keluar": keluar})

    return DashboardSummary(
        total_siswa=total_siswa,
        siswa_aktif=siswa_aktif,
        siswa_on_progress=siswa_on_progress,
        siswa_selesai=siswa_selesai,
        kas_masuk_bulan=kas_masuk_bulan,
        kas_keluar_bulan=kas_keluar_bulan,
        sisa_kas=sisa_kas,
        kas_masuk_total=kas_masuk_total,
        kas_keluar_total=kas_keluar_total,
        chart_7hari=chart,
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
