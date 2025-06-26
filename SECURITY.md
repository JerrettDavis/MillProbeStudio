# Security Policy

## Supported Versions

We actively support the following versions of Mill Probe Studio with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | ⚠️ Pre-release     |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these guidelines:

### 🔒 **Private Report (Preferred)**

For security vulnerabilities, please **DO NOT** create a public GitHub issue. Instead:

1. **Email us directly**: [security@jdhpro.com](mailto:security@jdhpro.com)
2. **Include detailed information**:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Any proof-of-concept code (if applicable)
   - Your contact information

### 📧 **Email Template**

```
Subject: [SECURITY] Vulnerability Report - Mill Probe Studio

Description:
[Detailed description of the vulnerability]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Impact:
[Description of potential impact]

Environment:
- Version: [e.g., 1.2.3]
- Browser: [e.g., Chrome 95]
- OS: [e.g., Windows 10]

Additional Information:
[Any additional context or files]
```

## 🚨 **Security Response Process**

1. **Acknowledgment**: We'll confirm receipt within 24 hours
2. **Assessment**: Initial assessment within 72 hours
3. **Investigation**: Detailed investigation and reproduction
4. **Fix Development**: Priority development of security patch
5. **Testing**: Thorough testing of the fix
6. **Release**: Coordinated security release
7. **Disclosure**: Public disclosure after fix is available

## 🕐 **Response Timeline**

- **Initial Response**: Within 24 hours
- **Status Update**: Within 72 hours
- **Security Fix**: Target 7-14 days (depending on severity)
- **Public Disclosure**: After fix is deployed and tested

## 🎯 **Scope**

### In Scope
- **Client-side vulnerabilities** (XSS, CSRF, etc.)
- **Dependency vulnerabilities** in production builds
- **Authentication/authorization issues**
- **Data validation problems**
- **File upload security issues**
- **Configuration vulnerabilities**

### Out of Scope
- **Development dependencies** (devDependencies in package.json)
- **Issues in third-party services** we don't control
- **Social engineering attacks**
- **Physical access attacks**
- **DDoS attacks**
- **Issues requiring physical access** to the user's machine

## 🛡️ **Security Best Practices**

### For Users
- **Keep updated** to the latest version
- **Use HTTPS** when accessing the application
- **Validate G-code** before using on production machines
- **Review imported files** from untrusted sources
- **Report suspicious behavior** immediately

### For Developers
- **Regular dependency updates** via automated tools
- **Static code analysis** in CI/CD pipeline
- **Input validation** on all user data
- **Secure defaults** in configuration
- **Content Security Policy** headers
- **Regular security audits**

## 🔍 **Known Security Considerations**

### G-code Processing
- **File validation**: All G-code files are parsed and validated
- **Sanitization**: Comments and commands are sanitized
- **Execution safety**: Application only generates G-code, never executes it

### Data Handling
- **Local storage**: All data is stored locally in the browser
- **No server communication**: Application runs entirely client-side
- **File uploads**: Files are processed locally, not uploaded to servers

### Dependencies
- **Regular audits**: Automated dependency vulnerability scanning
- **Minimal dependencies**: Only essential packages are included
- **Version pinning**: Specific versions to avoid supply chain attacks

## 📊 **Security Metrics**

We maintain the following security practices:

- **Automated dependency scanning** on every commit
- **Static code analysis** in CI/CD pipeline
- **Regular security reviews** of critical components
- **Penetration testing** before major releases

## 🏆 **Recognition**

Security researchers who report valid vulnerabilities will be:

- **Listed in our hall of fame** (with permission)
- **Credited in release notes** for the security fix
- **Invited to test** the fix before public release
- **Considered for bounty rewards** (case-by-case basis)

## 📚 **Security Resources**

- **OWASP Top 10**: We follow OWASP security guidelines
- **CVE Database**: Regular monitoring of relevant CVEs
- **Security Headers**: Implementation of security HTTP headers
- **Content Security Policy**: Strict CSP implementation

## 🔄 **Security Updates**

Security updates are handled with high priority:

1. **Critical**: Immediate patch release (within 24-48 hours)
2. **High**: Patch release within 7 days
3. **Medium**: Included in next minor release
4. **Low**: Included in next major release

## 📞 **Contact Information**

- **Security Email**: [security@jdhpro.com](mailto:security@jdhpro.com)
- **General Contact**: [jd@jdhpro.com](mailto:jd@jdhpro.com)
- **Response Time**: 24 hours for security issues

## 📄 **Disclosure Policy**

We believe in **responsible disclosure**:

- **Coordinate with us** before public disclosure
- **Allow reasonable time** for fix development
- **Credit researchers** appropriately
- **Maintain confidentiality** until fix is available

---

**Thank you for helping keep Mill Probe Studio secure!** 🔒
