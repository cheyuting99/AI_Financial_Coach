from fastapi import FastAPI, Query
from debt import router as debt_router
from spend import router as spend_router
from income import router as income_router
import duckdb
import os

port = int(os.environ.get("PORT", 8000))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=port)

app = FastAPI(title="Kaggle Expense Query API")

app.include_router(debt_router)
app.include_router(spend_router)
app.include_router(income_router)

CSV_PATH = "personal_expense_dataset.csv"

def connect_with_view():
    con = duckdb.connect()
    con.execute(f"""
    CREATE OR REPLACE VIEW expenses AS
    SELECT
      TRY_CAST(Date AS DATE) AS Date,
      Category,
      TRY_CAST(Amount AS DOUBLE) AS Amount,
      Payment_Mode,
      *
    FROM read_csv_auto('{CSV_PATH}')
    """)
    return con

@app.get("/health")
def health():
    return {"ok": True}
