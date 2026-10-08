"""Backend tests v2 for Amanah Drive — covers schedules, reports, reminders, siswa_id recompute."""
import pytest
import requests

BASE_URL = "https://amanah-drive.preview.emergentagent.com"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---- Dashboard shape (new fields) ----
def test_dashboard_new_fields(s):
    r = s.get(f"{API}/dashboard")
    assert r.status_code == 200
    d = r.json()
    assert "pengingat_pembayaran" in d and isinstance(d["pengingat_pembayaran"], list)
    assert "jadwal_hari_ini" in d and isinstance(d["jadwal_hari_ini"], list)
    for rem in d["pengingat_pembayaran"]:
        for k in ("siswa_id", "nama", "telepon", "paket", "harga_paket", "sudah_dibayar", "sisa_bayar", "status"):
            assert k in rem
        assert rem["sisa_bayar"] > 0
    for jd in d["jadwal_hari_ini"]:
        assert "_id" not in jd
    assert "_id" not in d


# ---- Instrukturs ----
def test_instrukturs_list(s):
    r = s.get(f"{API}/instrukturs")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    for x in data:
        assert isinstance(x, str) and x


# ---- Transactions with siswa_id -> recompute sudah_dibayar ----
class TestSiswaPaymentRecompute:
    student_id = None
    tx_id = None
    baseline_paid = 0

    def test_setup_student(self, s):
        r = s.post(f"{API}/students", json={
            "nama": "TEST_Recompute_Siswa",
            "telepon": "0812",
            "paket": "Mobil Manual",
            "total_pertemuan": 10,
            "harga_paket": 1500000,
            "sudah_dibayar": 0,
        })
        assert r.status_code == 200
        TestSiswaPaymentRecompute.student_id = r.json()["id"]

    def test_create_masuk_tx_with_siswa_id_updates_sudah_dibayar(self, s):
        sid = TestSiswaPaymentRecompute.student_id
        r = s.post(f"{API}/transactions", json={
            "jenis": "masuk",
            "kategori": "Pembayaran Kursus",
            "jumlah": 500000,
            "siswa_id": sid,
            "siswa_nama": "TEST_Recompute_Siswa",
        })
        assert r.status_code == 200
        TestSiswaPaymentRecompute.tx_id = r.json()["id"]
        # GET siswa — sudah_dibayar should be 500000
        r2 = s.get(f"{API}/students/{sid}")
        assert r2.status_code == 200
        assert r2.json()["sudah_dibayar"] == 500000

    def test_additional_payment_accumulates(self, s):
        sid = TestSiswaPaymentRecompute.student_id
        s.post(f"{API}/transactions", json={
            "jenis": "masuk",
            "kategori": "Pembayaran Kursus",
            "jumlah": 300000,
            "siswa_id": sid,
        })
        r = s.get(f"{API}/students/{sid}")
        assert r.json()["sudah_dibayar"] == 800000

    def test_delete_tx_decrements_sudah_dibayar(self, s):
        sid = TestSiswaPaymentRecompute.student_id
        r = s.delete(f"{API}/transactions/{TestSiswaPaymentRecompute.tx_id}")
        assert r.status_code == 200
        r2 = s.get(f"{API}/students/{sid}")
        # 800000 - 500000 = 300000
        assert r2.json()["sudah_dibayar"] == 300000

    def test_cleanup(self, s):
        s.delete(f"{API}/students/{TestSiswaPaymentRecompute.student_id}")


# ---- Schedules CRUD ----
class TestSchedules:
    sch_id = None

    def test_create_schedule(self, s):
        r = s.post(f"{API}/schedules", json={
            "tanggal": "2026-01-20",
            "jam_mulai": "08:00",
            "jam_selesai": "10:00",
            "instruktur": "TEST_Pak_Budi",
        })
        assert r.status_code == 200
        d = r.json()
        assert d["instruktur"] == "TEST_Pak_Budi"
        assert "_id" not in d
        TestSchedules.sch_id = d["id"]

    def test_filter_by_tanggal(self, s):
        r = s.get(f"{API}/schedules?tanggal=2026-01-20")
        assert r.status_code == 200
        rows = r.json()
        assert any(x["id"] == TestSchedules.sch_id for x in rows)
        for row in rows:
            assert row["tanggal"] == "2026-01-20"

    def test_update_schedule(self, s):
        r = s.put(f"{API}/schedules/{TestSchedules.sch_id}", json={"jam_mulai": "09:00"})
        assert r.status_code == 200
        assert r.json()["jam_mulai"] == "09:00"

    def test_instrukturs_includes_new(self, s):
        r = s.get(f"{API}/instrukturs")
        assert "TEST_Pak_Budi" in r.json()

    def test_delete_schedule_soft(self, s):
        r = s.delete(f"{API}/schedules/{TestSchedules.sch_id}")
        assert r.status_code == 200
        r2 = s.get(f"{API}/schedules?tanggal=2026-01-20")
        assert all(x["id"] != TestSchedules.sch_id for x in r2.json())


# ---- Reports ----
def test_report_cashflow_default(s):
    r = s.get(f"{API}/reports/cashflow")
    assert r.status_code == 200
    assert "text/html" in r.headers.get("content-type", "")
    body = r.text
    assert "Laporan Cashflow" in body
    # Must contain a valid Indonesian month name
    months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
    assert any(m in body for m in months)


def test_report_cashflow_feb_2026(s):
    r = s.get(f"{API}/reports/cashflow?bulan=2026-02")
    assert r.status_code == 200
    assert "Februari" in r.text
    assert "2026" in r.text


def test_report_cashflow_invalid(s):
    r = s.get(f"{API}/reports/cashflow?bulan=invalid")
    assert r.status_code == 400
