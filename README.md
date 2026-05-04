# Financial Dashboard

A static financial dashboard you can host with GitHub Pages. No backend is required.

## Files

- `index.html` - Main dashboard page
- `styles.css` - Dashboard styling
- `script.js` - CSV loading, filters, KPIs, charts, and table logic
- `data/transactions.csv` - Sample transaction data

## CSV format

Your CSV must use these exact headers:

```csv
Date,Type,Category,VendorCustomer,Account,Amount,Notes
```

Valid examples:

```csv
2026-01-01,Income,Contract Revenue,Customer Name,Business Checking,5000.00,Deposit
2026-01-02,Expense,Fuel,QuikTrip,PLATINUM-27004,85.12,Truck fuel
```

Use `Income` or `Expense` in the Type column.

## How to publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files and folders from this project.
3. Go to repository **Settings**.
4. Go to **Pages**.
5. Under **Build and deployment**, select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Save.
7. GitHub will provide a `github.io` link after the site builds.

## How to use your own data

Option 1: Replace `data/transactions.csv` in the repo with your own file using the same headers.

Option 2: Open the dashboard and use the **Upload CSV** button. This loads your CSV only in your browser and does not upload it to GitHub.

## Privacy note

If your GitHub repo is public, the CSV file in `data/transactions.csv` will be public too. Use sample or sanitized data unless the repo is private.
