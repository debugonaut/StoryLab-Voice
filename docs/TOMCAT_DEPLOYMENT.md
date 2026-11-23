# Apache Tomcat Server Installation & Configuration Guide

> **Coursework Reference:** PRACTICAL NO. 01 Pre-Work  
> *"Pre Work: Installation and Configuration of Web Application Servers - Tomcat."*  
> **Course:** Web Technology (2310362L) — MIT Academy of Engineering (MITAOE)

---

## 1. Overview of Apache Tomcat

Apache Tomcat is an open-source Java Servlet container and web server developed by the Apache Software Foundation. In enterprise web architectures, Tomcat serves dynamic web content (JSP, Java Servlets, WAR applications) and acts as an HTTP web application server.

In this project, Tomcat is configured as the web application server host for the client portal and static assets, while reverse-proxying API calls to the Node.js/Express.js RESTful API.

---

## 2. Prerequisites & Installation

### Step 1: Java Development Kit (JDK)
Tomcat requires Java SE 8 or later (JDK 17 or JDK 21 recommended).
Verify installation:
```bash
java -version
```
Ensure `JAVA_HOME` environment variable is set:
```bash
# Windows
setx JAVA_HOME "C:\Program Files\Java\jdk-21"

# Linux / macOS
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

### Step 2: Download & Extract Apache Tomcat
1. Download **Apache Tomcat 10.1.x** (Binary Distribution Core `.zip` or `.tar.gz`) from [https://tomcat.apache.org/](https://tomcat.apache.org/).
2. Extract to target directory:
   - Windows: `C:\apache-tomcat-10.1`
   - Linux: `/opt/tomcat`

---

## 3. Directory Structure

```
C:\apache-tomcat-10.1\
├── bin/          # Startup (startup.bat / startup.sh) and shutdown scripts
├── conf/         # Configuration files (server.xml, web.xml, context.xml)
├── lib/          # Tomcat internal JARs and servlet libraries
├── logs/         # Server logs (catalina.out, localhost_access_log.txt)
├── temp/         # Temporary cache files
├── webapps/      # Deployment directory for WAR files and web applications
└── work/         # Compiled JSP servlets and session data
```

---

## 4. Key Server Configuration (`conf/server.xml`)

### Changing Default Port (Default: 8080)
Open `conf/server.xml` and locate the HTTP Connector:
```xml
<Connector port="8080" 
           protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443" 
           URIEncoding="UTF-8" />
```

### Reverse Proxy Configuration (Connecting Tomcat to Node.js/Express Backend)
To route `/api/*` traffic from Tomcat (Port 8080) to the Node.js Express server (Port 5000), enable the AJP Connector or use an HTTP Proxy Servlet:

```xml
<!-- Example ProxyPass configuration inside context.xml or Apache Fronting -->
<Context docBase="C:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/wt-portal" path="/storylab">
    <Resources cachingAllowed="true" cacheMaxSize="100000" />
</Context>
```

---

## 5. Web Application Deployment (WAR)

### Method 1: Exploded Directory Deployment
Place the web directory (such as `wt-portal/` or `client-react/`) directly into Tomcat's `webapps/` folder:
```bash
xcopy /E /I wt-portal C:\apache-tomcat-10.1\webapps\storylab-wt
```
The application is immediately accessible at:
```
http://localhost:8080/storylab-wt/index.html
```

### Method 2: Packaged WAR (Web Application Archive)
Generate a standard `.war` archive:
```bash
jar -cvf storylab.war -C wt-portal/ .
```
Copy `storylab.war` into `webapps/`. Tomcat automatically extracts and deploys the application.

---

## 6. Starting and Stopping Tomcat

### On Windows:
```cmd
# Start Server
C:\apache-tomcat-10.1\bin\startup.bat

# Stop Server
C:\apache-tomcat-10.1\bin\shutdown.bat
```

### Verification:
Navigate to `http://localhost:8080`. The Apache Tomcat Manager and Welcome Screen will verify successful operational status.

