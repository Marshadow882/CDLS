# Campus Device Loan System
## 1. Project Overview

This project implements a web-based **Campus Device Loan System** that allows students to view and reserve shared IT devices, and staff members to manage device collection and returns.

The system is implemented as a small cloud-native application composed of a frontend web interface and multiple backend services. It focuses on secure access, clear separation of responsibilities, and automated deployment using modern DevOps practices.

---

## 2. System Functionality

### Students
- Log in using a third-party authentication provider
- Browse available device models and current availability
- Reserve a device for a fixed loan period
- View the status of their reservations

### Staff
- Log in with a staff role
- View active reservations
- Mark devices as collected and returned
- Automatically record timestamps for key actions

### General
- Device availability is updated based on reservations and returns
- Loan rules (e.g. standard loan duration) are enforced by backend services
- Invalid or unauthorized actions are rejected by the backend

---

## 3. Architecture Summary

The system is structured using a **service-based architecture**:

- A **frontend web application** provides the user interface
- Backend functionality is split across multiple **independent services**, each with a focused responsibility
- A **cloud-hosted database** is used to persist devices, reservations, and loan records
- Authentication is handled by an external identity provider using OAuth2 / OpenID Connect

The application is deployed using **serverless cloud services**, allowing the backend to remain stateless and scalable.

Architecture diagrams (Context, Container, and Deployment) are included in the `Documentation` directory.

---

## 4. Security Approach

- Users authenticate via OAuth2 / OpenID Connect
- Backend services validate JWT access tokens
- Role information in the token is used to enforce **role-based access control**
- Sensitive operations are protected server-side
- Unauthorized and forbidden requests return appropriate HTTP status codes

---

## 5. DevOps & Deployment

The project uses an automated DevOps workflow:

- Source code is version controlled using Git
- Continuous Integration is implemented using GitHub Actions
- Automated steps include dependency installation, testing, and build
- Successful builds are automatically deployed to the cloud environment
- Configuration values are provided via environment variables

This approach ensures consistent builds and repeatable deployments.

---

## 6. Observability & Reliability

- Backend services expose basic health or readiness endpoints
- Logs are written for key operations and errors
- The system handles invalid input and authorization failures gracefully

---

## 7. Testing

- Automated tests are implemented for key parts of the backend logic
- Tests are executed as part of the CI pipeline
- Manual testing was also performed to verify end-to-end user flows

---

## 8. Demonstration Evidence

Demonstration evidence is provided in the `Media` directory and includes:

- Screenshots showing:
  - Successful login
  - Device availability and reservation flow
  - Staff collection and return actions
  - Role-based access control behaviour
  - CI/CD pipeline execution
- Short video clips demonstrating:
  - End-to-end student workflow
  - Staff management workflow
  - Security and DevOps evidence

Each piece of evidence is briefly described in `Media/evidence-notes.md`.

---

## 9. Project Structure

/
├── Media/
├── Source/
│ ├── frontend/
│ ├── device-service/
│ └── loan-service/
├── Documentation/
└── README.md

Build artifacts and generated files have been removed prior to submission.

---

## 10. Final Notes

This project demonstrates the practical application of cloud-native development and DevOps principles, including service separation, secure authentication, automated deployment, and observable runtime behaviour.

Design decisions and trade-offs are discussed further in the accompanying report.
