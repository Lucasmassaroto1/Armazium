CREATE DATABASE armazium CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- php artisan make:migration add_role_to_users --table=users
-- php artisan make:migration create_clients_table
-- php artisan make:migration add_is_system_to_clients_table --table=clients
-- php artisan make:migration create_products_table
-- php artisan make:migration create_stock_movements_table
-- php artisan make:migration create_sales_and_sale_items_tables
-- php artisan make:migration create_repairs_table
-- php artisan make:migration add_sold_at_to_sales_table

-- php artisan migrate

-- php artisan make:controller ProductController --model=Product --requests
-- php artisan make:request ProductStoreRequest
-- php artisan make:request ProductUpdateRequest
-- php artisan make:resource ProductResource

-- php artisan make:controller ClientController --model=Client
-- php artisan make:controller SaleController   --model=Sale
-- php artisan make:controller RepairController --model=Repair
-- php artisan make:controller DashboardController

-- php artisan make:seeder DefaultConsumerSeeder

-- php artisan db:seed --class=DefaultConsumerSeeder