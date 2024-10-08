<h1 align="center">
    <img align="left" width="100" height="100" src="../images/zentaris.png" alt="Zentaris"/>
    <br />
    <p style="color: #808080; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">
    Zentaris API Server
    </p>
</h1>

<br/>

## Zentaris API Server

Zentaris API server is a local security service engine to build Hypergraph dependencies, scan resource attributes, and traverse relationships to evaluate attack path risks in the system. Currently, the API service only provide in-memory DB to discover, scan, and analyze MITRE and other vulnerabilities. This enables enterprises to be less concerned about sharing these data for privacy concerns.

- REST CRUD requests on hypergraph building
- Trigger security scanning evaluation by walking hypergraphs
- Generates attack graph scenarios from hypergraph relationships, and attributes
- Provides risk categorization metrics

## API Server Endpoints

### Hypergraph container

```
/v1/apps
/v1/app/{id}
```

### Hypergraph Entities, Association Building

```
/v1/app/{id}/entities
/v1/app/{aid}/entity/{eid}
/v1/app/{id}/assocs
/v1/app/{aid}/assoc/{sid}
```

### Hypergraph Evaluation

```
/v1/app/{id}/eval
```

### Attack Graph Scenario Generations

```
/v1/attackGraphs
```

### Risk Evaluation Statistics

```
/v1/risk
```

## API Server Usage

```
$ ./build/apiserver 
```
<br/>OSS sponsored with ![Red Heart](https://img.shields.io/badge/-❤-ff0000?style=for-the-badge) by
    <a href="https://zetafence.com">
    <img align="center" width="85" src="https://img.shields.io/badge/Zetafence-8A2BE2" alt="Zetafence"/></a>
2024.
