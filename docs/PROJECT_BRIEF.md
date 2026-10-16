# Uni Lab Track

PROJECT MASTER PROMPT

UOP Computer Laboratory Usage Monitoring and Management System

Act as a senior full-stack software engineer and UI/UX designer. Design and develop a complete, professional, functional, secure, and responsive web application for the Department of Information Technology, Faculty of Arts, University of Peradeniya (UOP), Sri Lanka.

1. PROJECT OVERVIEW

Develop a Computer Laboratory Usage Monitoring and Management System to digitally record, monitor, manage, and report the usage of three computer laboratories owned by the Department of IT.

Other university departments use these laboratories for lectures, practical sessions, examinations, and other academic activities. The system must provide a centralized platform for recording laboratory usage, identifying the responsible lecturer or staff member, tracking actual usage durations, monitoring equipment issues, generating printable usage documents, and preparing monthly reports for review and signatures by the relevant Heads of Department (HODs).

This is a laboratory usage monitoring system, NOT a booking or reservation system. Do not include future reservations, booking approvals, or individual student computer bookings.

2. MANDATORY TECHNOLOGIES

Build the entire application using only:

HTML5: Page structure and forms.

CSS3: Styling, layouts, animations, and responsive design.

Vanilla JavaScript: Client-side interactions, form validation, and dynamic interface behavior.

Core PHP: Backend logic, authentication, form processing, database operations, report generation, and application functionality.

MySQL: Database storage and management.

Use PHP with PDO and prepared statements for secure database operations.

Do not use React, Node.js, Laravel, Bootstrap, Tailwind CSS, jQuery, or other application frameworks. Use custom CSS and vanilla JavaScript.

3. OFFICIAL UOP BRANDING AND VISUAL DESIGN

Create a premium, modern, professional university administration interface using the official branding of the University of Peradeniya.

Official logo:

Use the official University of Peradeniya logo.

Obtain it from an authorized official university source or use an official logo file supplied by the university.

Do not invent, redraw, distort, or substitute the logo with an unofficial design.

Preserve its original proportions and visual integrity.

Position it appropriately in the application header, login page, dashboard, and printable reports where suitable.

Color theme: Yellow in multiple shades.

Build the complete visual identity around a coordinated yellow color palette, including:

Bright yellow accents.

Golden yellow.

Soft pastel yellow.

Pale yellow backgrounds.

Deep golden yellow for emphasis.

Dark charcoal or black for readable text.

White and subtle neutral colors for balance.

Use yellow as the dominant brand color throughout the application. Maintain excellent contrast, readability, accessibility, and a sophisticated professional appearance. Do not make every element bright yellow; combine different shades thoughtfully.

Create a consistent design system with polished typography, spacious layouts, subtle shadows, refined borders, consistent buttons, modern tables, clear status indicators, and professional icons.

Use a clean university-administration dashboard aesthetic rather than a generic template.

Ensure the interface is fully responsive on mobile phones, tablets, laptops, and desktop computers.

4. REQUIRED SYSTEM FEATURES

A. Laboratory Management

Manage the three computer laboratories.

Maintain each laboratory's unique ID, name, and status.

Associate each laboratory with its existing QR-code destination.

Allow authorized administrators to update laboratory details.

B. QR-Based Usage Recording

Each laboratory has a QR code displayed outside its entrance.

Scanning the QR code opens a mobile-friendly usage form associated with that laboratory.

Automatically identify the relevant laboratory from the QR-code destination.

Record the visiting faculty and department, responsible lecturer or staff member, contact details where required, purpose of use, date, expected times if known, participant counts, and relevant notes.

Validate all required information.

Save successful submissions in MySQL.

Generate a unique usage record ID.

Display a professional submission confirmation.

C. Usage Record Management

Allow authorized IT staff to view, search, filter, and manage usage records.

Filter records by date, month, laboratory, visiting department, and verification status.

Display complete usage details.

Preserve historical records and prevent unauthorized changes.

D. Actual Usage Time Verification

Allow authorized laboratory staff to record or verify actual start and end times.

Calculate actual usage duration from valid, verified timestamps.

Clearly distinguish expected times from actual times.

Identify incomplete or unverified records.

Never calculate confirmed usage durations using unverified expected times.

E. PDF Generation and Printing

Generate a professional, downloadable, printable A4 PDF for each usage record.

Include official UOP branding, department identification, record ID, laboratory details, visiting department, responsible person, purpose, date, participant counts, and relevant usage times.

Include signature spaces for the IT Department HOD and visiting department HOD, according to the approved procedure.

Provide clear download and print options.

Ensure the PDF reflects the actual saved record.

F. Equipment Issue Management

Record equipment faults, damage observations, and maintenance issues.

Include the relevant laboratory, equipment identifier where available, description, report date, priority, status, actions taken, and resolution details.

Allow authorized staff to track unresolved and resolved incidents.

G. Administrative Dashboard

Create a professional dashboard for authorized IT Department staff.

Display total usage sessions, usage by laboratory, visiting department statistics, verified usage hours, pending verification records, equipment incidents, and recent activity.

Retrieve statistics dynamically from MySQL.

Include useful charts and visual summaries where appropriate.

Do not use hardcoded production statistics.

H. Monthly Usage Reports

Allow administrators to select a month and generate a consolidated report covering all three laboratories.

Include usage records, visiting departments, responsible lecturers, dates, verified durations, participant counts, and equipment issues.

Calculate total verified usage hours for each laboratory and visiting department.

Clearly identify missing or unverified information.

Provide professional PDF export and printing.

Include the appropriate HOD signature spaces according to the department's actual administrative procedure.

I. Authentication and Security

Provide secure administrator login and logout.

Use PHP sessions, password hashing, server-side validation, and role-based authorization.

Protect administrative pages and database operations from unauthorized access.

Use prepared statements, output escaping, and CSRF protection where appropriate.

Keep database credentials outside publicly accessible files.

Ensure that QR-code access does not grant administrative privileges.

5. DATABASE AND APPLICATION ARCHITECTURE

Design a suitable, normalized MySQL database to support laboratories, departments, users, usage records, actual-time verification, equipment incidents, and relevant audit records.

Use appropriate primary keys, foreign keys, constraints, indexes, and timestamps.

Organize the PHP application into clear, maintainable components for database connectivity, authentication, validation, business logic, page presentation, PDF generation, and reporting.

Use reusable HTML components, organized CSS files, and separate JavaScript files.

Implement server-side validation and authorization in PHP. Client-side JavaScript must improve usability but must never replace backend security.

6. DEVELOPMENT AND DELIVERY

Develop a complete working application rather than a static UI mockup.

Implement all required pages, database operations, forms, authentication, usage-record management, verification functionality, equipment issue management, PDF generation, dashboard statistics, and monthly reports.

Ensure all navigation, buttons, forms, filters, calculations, and administrative actions work correctly.

Use realistic synthetic data during development. Do not invent official university information or use real personal information without authorization.

Provide the complete source code, MySQL database schema, database setup instructions, configuration guidance, and necessary installation documentation.

Test the application for functionality, database integrity, responsive design, security, accurate duration calculations, and correct monthly reporting.

Do not claim that a feature has been tested or works unless it has actually been verified.

FINAL OBJECTIVE

Deliver a complete, professional, secure, responsive UOP Computer Laboratory Usage Monitoring and Management System built exclusively with HTML, CSS, vanilla JavaScript, core PHP, and MySQL.

The final application must reflect the official University of Peradeniya identity, use a sophisticated theme based on multiple shades of yellow, provide a polished administrative dashboard, simplify QR-based laboratory usage recording, generate professional printable PDFs, track actual laboratory usage, manage equipment issues, and produce accurate monthly reports for the Department of IT.

Prioritize functional correctness, professional design, usability, data integrity, and maintainable code.
