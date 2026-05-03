"""Direct seed using engine.begin() - guaranteed to commit."""
import asyncio, uuid, bcrypt, os, sys

def _load_env():
    for path in ['.env', 'erp-backend/.env']:
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, _, v = line.partition('=')
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return
_load_env()

URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://sidarthakumar@localhost/erp_db')

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

def uid(): return str(uuid.uuid4())
def hp(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

async def seed():
    engine = create_async_engine(URL, echo=False)
    print('🌱 Seeding...')

    # Each block in its own transaction so one failure doesn't block others
    async with engine.begin() as c:
        tid = uid()
        await c.execute(text(
            "INSERT INTO tenants (id,name,slug,plan,is_active) VALUES "
            "('" + tid + "','Bright LED Manufacturing','bright-led','professional',true)"
        ))
        print('✅ Tenant:', tid)

    async with engine.begin() as c:
        roles = [('super_admin','Super Admin'),('admin','Admin'),('manager','Manager'),
                 ('production','Production'),('accounts','Accounts'),('hr_manager','HR Manager'),('viewer','Viewer')]
        rids = {}
        for slug, name in roles:
            r = uid(); rids[slug] = r
            await c.execute(text(
                "INSERT INTO roles (id,tenant_id,name,slug) VALUES "
                "('" + r + "','" + tid + "','" + name + "','" + slug + "')"
            ))
        print('✅ Roles:', len(roles))

    async with engine.begin() as c:
        users = [
            ('Super Admin','admin@brightled.com','admin123','super_admin'),
            ('Rahul Sharma','rahul@brightled.com','admin123','admin'),
            ('Priya Patel','priya@brightled.com','pass123','manager'),
            ('Amit Kumar','amit@brightled.com','pass123','production'),
            ('Sunita Joshi','sunita@brightled.com','pass123','accounts'),
            ('Deepak Verma','deepak@brightled.com','pass123','hr_manager'),
            ('Raj Verma','raj@brightled.com','pass123','production'),
            ('Meena Singh','meena@brightled.com','pass123','viewer'),
        ]
        for name, email, pw, role in users:
            h = hp(pw)
            rid = rids.get(role, rids['viewer'])
            await c.execute(text(
                "INSERT INTO users (id,tenant_id,role_id,name,email,hashed_password,is_active,role) VALUES "
                "('" + uid() + "','" + tid + "','" + rid + "','" + name + "','"
                + email + "','" + h + "',true,'" + role + "')"
            ))
        print('✅ Users:', len(users))

    async with engine.begin() as c:
        employees = [
            ('Raj Verma','raj@brightled.com','+91-9876543210','Production','Operator','operator','2020-06-01'),
            ('Meena Singh','meena@brightled.com','+91-9876543211','Production','Operator','operator','2021-03-15'),
            ('Amit Kumar','amit@brightled.com','+91-9876543212','Quality','QC Inspector','qc','2019-08-01'),
            ('Priya Patel','priya@brightled.com','+91-9876543213','Management','Production Manager','manager','2018-01-01'),
            ('Sunita Joshi','sunita@brightled.com','+91-9876543214','Accounts','Accountant','accounts','2020-11-01'),
            ('Deepak Verma','deepak@brightled.com','+91-9876543215','HR','HR Manager','hr_manager','2019-04-01'),
            ('Ravi Mishra','ravi@brightled.com','+91-9876543216','Maintenance','Technician','technician','2021-06-15'),
            ('Kavita Shah','kavita@brightled.com','+91-9876543217','Dispatch','Dispatch Executive','dispatch','2022-01-10'),
        ]
        for name, email, phone, dept, desg, role, jdate in employees:
            await c.execute(text(
                "INSERT INTO hr_employees (id,tenant_id,name,email,phone,department,designation,role,join_date,status) VALUES "
                "('" + uid() + "','" + tid + "','" + name + "','" + email + "','"
                + phone + "','" + dept + "','" + desg + "','" + role + "','" + jdate + "','active')"
            ))
        print('✅ Employees:', len(employees))

    async with engine.begin() as c:
        products = [
            ('LED Chip 9W','CHIP-9W','LED Components','Pcs',18,28,2500,500),
            ('LED Chip 18W','CHIP-18W','LED Components','Pcs',35,55,1200,300),
            ('LED Driver 9W','DRV-9W','Drivers','Pcs',22,38,1800,400),
            ('LED Driver 20W','DRV-20W','Drivers','Pcs',70,110,900,200),
            ('Aluminium Housing 9W','HOUS-9W','Housings','Pcs',12,22,3000,600),
            ('PC Cover Opal','COVER-PC-O','Covers','Pcs',5,9,4000,800),
            ('E27 Lamp Base','BASE-E27','Components','Pcs',3,7,5000,1000),
            ('LED Bulb 9W FG','FG-BULB-9W','Finished Goods','Pcs',65,85,850,200),
            ('LED Panel 18W FG','FG-PAN-18W','Finished Goods','Pcs',220,295,320,80),
            ('LED Strip 5m FG','FG-STRIP-5M','Finished Goods','Pcs',145,195,180,50),
            ('Cardboard Box','PKG-BOX-SM','Packaging','Pcs',4,0,2000,500),
        ]
        for name, sku, cat, unit, cost, sell, stock, reorder in products:
            await c.execute(text(
                "INSERT INTO inventory_products (id,tenant_id,name,sku,category,unit,cost_price,selling_price,stock,reorder_point,status) VALUES "
                "('" + uid() + "','" + tid + "','" + name + "','" + sku + "','" + cat + "','"
                + unit + "'," + str(cost) + "," + str(sell) + "," + str(stock) + "," + str(reorder) + ",'active')"
            ))
        print('✅ Products:', len(products))

    async with engine.begin() as c:
        customers = [
            ('Bright Electricals Pvt Ltd','bright@electricals.com','+91-22-66778899','27AABCB1234R1ZX',500000),
            ('SunPower Solutions','purchase@sunpower.in','+91-80-44556677','29AABCS5678R1ZX',300000),
            ('Gujarat Solar Corp','orders@gujaratsolar.com','+91-79-33445566','24AABCG9012R1ZX',200000),
            ('Sharma LED Traders','sharma@ledtraders.com','+91-11-55667788','07AABCS3456R1ZX',150000),
            ('National Electricals','buy@nationalelec.com','+91-44-22334455','33AAACN7890R1ZX',250000),
        ]
        cids = {}
        for name, email, phone, gstin, credit in customers:
            c2 = uid(); cids[name] = c2
            await c.execute(text(
                "INSERT INTO customers (id,tenant_id,name,email,phone,gstin,credit_limit,is_active) VALUES "
                "('" + c2 + "','" + tid + "','" + name + "','" + email + "','"
                + phone + "','" + gstin + "'," + str(credit) + ",true)"
            ))
        print('✅ Customers:', len(customers))

    async with engine.begin() as c:
        wos = [
            ('LED Bulb 9W FG',500,'Pcs','in_production','high','Raj Verma','2024-07-22'),
            ('LED Panel 18W FG',200,'Pcs','qc_pending','normal','Meena Singh','2024-07-20'),
            ('LED Bulb 9W FG',1000,'Pcs','planned','high','Raj Verma','2024-07-28'),
            ('LED Strip 5m FG',150,'Pcs','completed','low','Raj Verma','2024-07-15'),
        ]
        for pname, qty, unit, status, prio, assigned, pdate in wos:
            await c.execute(text(
                "INSERT INTO work_orders (id,tenant_id,product_name,quantity,unit,status,priority,planned_date,assigned_to) VALUES "
                "('" + uid() + "','" + tid + "','" + pname + "'," + str(qty) + ",'"
                + unit + "','" + status + "','" + prio + "','" + pdate + "','" + assigned + "')"
            ))
        print('✅ Work Orders:', len(wos))

    async with engine.begin() as c:
        sales = [
            ('Bright Electricals Pvt Ltd','SO-0041','approved',84000,7287,91287,'2024-07-20','2024-07-30'),
            ('SunPower Solutions','SO-0040','invoiced',111607,9659,121266,'2024-07-18','2024-07-28'),
            ('Gujarat Solar Corp','SO-0039','approved',82627,7147,89774,'2024-07-15','2024-07-25'),
            ('Sharma LED Traders','SO-0038','draft',43000,3719,46719,'2024-07-22','2024-08-05'),
            ('National Electricals','SO-0037','paid',183051,15831,198882,'2024-07-10','2024-07-20'),
        ]
        for cname, onum, status, sub, tax, total, odate, ddate in sales:
            await c.execute(text(
                "INSERT INTO sales_orders (id,tenant_id,order_number,customer_name,status,subtotal,tax_amount,total_amount,order_date,delivery_date) VALUES "
                "('" + uid() + "','" + tid + "','" + onum + "','" + cname + "','" + status + "',"
                + str(sub) + "," + str(tax) + "," + str(total) + ",'" + odate + "','" + ddate + "')"
            ))
        print('✅ Sales Orders:', len(sales))

    async with engine.begin() as c:
        leads = [
            ('Reliance Industries','Purchase Head','purchase@ril.com','+91-22-44556677','website','qualified',500000),
            ('Tata Power Solar','Procurement Mgr','solar@tatapower.com','+91-22-88990011','referral','proposal',300000),
            ('Adani Green Energy','VP Procurement','proc@adanigr.com','+91-79-33221100','exhibition','negotiation',750000),
            ('L and T Construction','Purchase Officer','purchase@lnt.com','+91-22-67894532','cold_call','contacted',150000),
            ('MSEDCL','Stores Manager','stores@msedcl.com','+91-22-22617000','referral','qualified',2000000),
        ]
        for cname, contact, email, phone, source, status, val in leads:
            await c.execute(text(
                "INSERT INTO crm_leads (id,tenant_id,name,contact_name,email,phone,source,status,estimated_value) VALUES "
                "('" + uid() + "','" + tid + "','" + cname + "','" + contact + "','"
                + email + "','" + phone + "','" + source + "','" + status + "'," + str(val) + ")"
            ))
        print('✅ CRM Leads:', len(leads))

    print('\n✅ All done!')
    print('   Login: admin@brightled.com / admin123')

asyncio.run(seed())