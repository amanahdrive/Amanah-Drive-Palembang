"""Backend tests for Amanah Drive API."""
import os
import pytest
import requests

BASE_URL = "https://amanah-drive.preview.emergentagent.com"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Health / root ----
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert "Amanah Drive" in data.get("message", "")


# ---- Packages ----
def test_packages_default_three(session):
    r = session.get(f"{API}/packages")
    assert r.status_code == 200
    pkgs = r.json()
    assert isinstance(pkgs, list)
    names = {p["nama"]: p for p in pkgs}
    assert "Mobil Manual" in names and names["Mobil Manual"]["harga"] == 1500000
    assert "Mobil Matic" in names and names["Mobil Matic"]["harga"] == 1400000
    assert "Motor" in names and names["Motor"]["harga"] == 500000
    for p in pkgs:
        assert "_id" not in p


# ---- Categories ----
def test_categories(session):
    r = session.get(f"{API}/categories")
    assert r.status_code == 200
    data = r.json()
    assert "masuk" in data and "keluar" in data
    assert isinstance(data["masuk"], list) and len(data["masuk"]) > 0
    assert isinstance(data["keluar"], list) and len(data["keluar"]) > 0


# ---- Dashboard ----
def test_dashboard_shape(session):
    r = session.get(f"{API}/dashboard")
    assert r.status_code == 200
    d = r.json()
    for k in [
        "total_siswa", "siswa_aktif", "siswa_on_progress", "siswa_selesai",
        "kas_masuk_bulan", "kas_keluar_bulan", "sisa_kas",
        "kas_masuk_total", "kas_keluar_total", "chart_7hari",
    ]:
        assert k in d, f"Missing key {k}"
    assert isinstance(d["chart_7hari"], list) and len(d["chart_7hari"]) == 7
    for item in d["chart_7hari"]:
        for k in ("tanggal", "label", "masuk", "keluar"):
            assert k in item
    assert "_id" not in d


# ---- Students CRUD ----
class TestStudents:
    created_id = None

    def test_list_students(self, session):
        r = session.get(f"{API}/students")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        for row in rows:
            assert "_id" not in row
            assert "id" in row

    def test_create_student(self, session):
        payload = {
            "nama": "TEST_Siswa_Automation",
            "telepon": "081200009999",
            "paket": "Mobil Manual",
            "total_pertemuan": 10,
            "harga_paket": 1500000,
        }
        r = session.post(f"{API}/students", json=payload)
        assert r.status_code == 200
        s = r.json()
        assert s["nama"] == payload["nama"]
        assert s["status"] == "aktif"
        assert "id" in s and "_id" not in s
        TestStudents.created_id = s["id"]

    def test_get_student(self, session):
        assert TestStudents.created_id
        r = session.get(f"{API}/students/{TestStudents.created_id}")
        assert r.status_code == 200
        assert r.json()["nama"] == "TEST_Siswa_Automation"

    def test_filter_aktif(self, session):
        r = session.get(f"{API}/students?status=aktif")
        assert r.status_code == 200
        rows = r.json()
        assert all(s["status"] == "aktif" for s in rows)
        assert any(s["id"] == TestStudents.created_id for s in rows)

    def test_update_sets_on_progress(self, session):
        r = session.put(
            f"{API}/students/{TestStudents.created_id}",
            json={"pertemuan_selesai": 3},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "on_progress"

    def test_update_sets_selesai(self, session):
        r = session.put(
            f"{API}/students/{TestStudents.created_id}",
            json={"pertemuan_selesai": 10},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "selesai"

    def test_delete_soft(self, session):
        r = session.delete(f"{API}/students/{TestStudents.created_id}")
        assert r.status_code == 200
        # Not returned afterwards
        r2 = session.get(f"{API}/students")
        assert all(s["id"] != TestStudents.created_id for s in r2.json())
        # Direct GET -> 404
        r3 = session.get(f"{API}/students/{TestStudents.created_id}")
        assert r3.status_code == 404


# ---- Transactions CRUD + Dashboard sisa_kas ----
class TestTransactions:
    tx_masuk_id = None
    tx_keluar_id = None
    baseline_masuk = 0
    baseline_keluar = 0

    def test_baseline(self, session):
        r = session.get(f"{API}/dashboard")
        assert r.status_code == 200
        d = r.json()
        TestTransactions.baseline_masuk = d["kas_masuk_total"]
        TestTransactions.baseline_keluar = d["kas_keluar_total"]

    def test_create_masuk(self, session):
        r = session.post(
            f"{API}/transactions",
            json={
                "jenis": "masuk",
                "kategori": "Pembayaran Kursus",
                "jumlah": 123456,
                "keterangan": "TEST_masuk_automation",
            },
        )
        assert r.status_code == 200
        tx = r.json()
        assert tx["jenis"] == "masuk" and tx["jumlah"] == 123456
        assert "_id" not in tx
        TestTransactions.tx_masuk_id = tx["id"]

    def test_create_keluar(self, session):
        r = session.post(
            f"{API}/transactions",
            json={
                "jenis": "keluar",
                "kategori": "BBM",
                "jumlah": 7890,
                "keterangan": "TEST_keluar_automation",
            },
        )
        assert r.status_code == 200
        tx = r.json()
        assert tx["jenis"] == "keluar"
        TestTransactions.tx_keluar_id = tx["id"]

    def test_filter_jenis_masuk(self, session):
        r = session.get(f"{API}/transactions?jenis=masuk")
        assert r.status_code == 200
        rows = r.json()
        assert all(t["jenis"] == "masuk" for t in rows)
        assert any(t["id"] == TestTransactions.tx_masuk_id for t in rows)

    def test_filter_bulan_ini(self, session):
        r = session.get(f"{API}/transactions?bulan_ini=true")
        assert r.status_code == 200
        rows = r.json()
        # Both newly created transactions should be in current month
        ids = [t["id"] for t in rows]
        assert TestTransactions.tx_masuk_id in ids
        assert TestTransactions.tx_keluar_id in ids

    def test_dashboard_sisa_kas_after_tx(self, session):
        r = session.get(f"{API}/dashboard")
        d = r.json()
        assert d["kas_masuk_total"] == TestTransactions.baseline_masuk + 123456
        assert d["kas_keluar_total"] == TestTransactions.baseline_keluar + 7890
        assert d["sisa_kas"] == d["kas_masuk_total"] - d["kas_keluar_total"]

    def test_update_transaction(self, session):
        r = session.put(
            f"{API}/transactions/{TestTransactions.tx_masuk_id}",
            json={"jumlah": 200000},
        )
        assert r.status_code == 200
        assert r.json()["jumlah"] == 200000

    def test_delete_transaction_soft(self, session):
        for tx_id in (TestTransactions.tx_masuk_id, TestTransactions.tx_keluar_id):
            r = session.delete(f"{API}/transactions/{tx_id}")
            assert r.status_code == 200
            r2 = session.get(f"{API}/transactions/{tx_id}")
            assert r2.status_code == 404
