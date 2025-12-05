#!/bin/bash
curl -X POST http://localhost:3000/api/connections/quick-connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzQ5MmVjZS0wYWUxLTQ1ZDgtYTQ4Ni1lMzljZmE0OGNmYjUiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBzc2htYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzY0Njk5OTMzLCJleHAiOjE3NjUzMDQ3MzMsImF1ZCI6InNzaC1tYW5hZ2VyLXVzZXJzIiwiaXNzIjoic3NoLW1hbmFnZXIifQ.Tq07_JNYr2TAV3cVtyYnZiwL3Upbf4XfUlhROSNp3YE" \
  -d '{
    "host": "172.19.0.4",
    "port": 22,
    "username": "centos",
    "password": "centos123",
    "name": "CentOS-Internal"
  }'