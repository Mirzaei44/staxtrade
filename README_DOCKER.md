Docker Guide

This project includes a full Django API backend and React frontend, containerized using Docker.

Below is the exact process to build, run, and load sample data.



1- Start Docker Containers

From the project root, run:

docker compose up --build

This will:
	•	Build the backend image (stax_backend)
	•	Build the frontend image (stax_frontend)
	•	Start both containers
	•	Backend available at: http://localhost:8000
	•	Frontend available at: http://localhost:3000



2- Apply Database Migrations Inside the Backend Container


Open a shell inside the backend:


docker exec -it stax_backend bash


Run migrations:


python manage.py migrate




3- Create an Admin User

Inside the backend container:

python manage.py createsuperuser

Follow the prompts to set username + password.



4- Load Sample Data

This repo includes a script that generates:
	•	1,500 products
	•	20,000 realistic orders
	•	multiple brands
	•	5 sample users

To run the seeder:

docker exec -it stax_backend bash

Then inside the container:

python manage.py shell

Inside the shell:

from api.fake_data import seed_data
seed_data()

Type exit() to leave the shell.



5- Accessing the App

Frontend:

http://localhost:3000

Backend API:

http://localhost:8000/api/

Django Admin:

http://localhost:8000/admin
(use the superuser created earlier)



6- Stopping Docker

Stop all containers:

docker compose down

Rebuild if needed:

docker compose up --build



