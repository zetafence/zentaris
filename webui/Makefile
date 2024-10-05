PKG_CMD := yarn
REPO := docker.io/zentaris
UISERVER := uiserver

# Tagged release
TAG := v1.0.0

all:
	@echo "Installing dependencies.."
	@$(PKG_CMD) install
	@echo "Building uiserver.."
	@$(PKG_CMD) build

start:
	@echo "Starting uiserver.."
	@$(PKG_CMD) start

docker-build:
	@echo "Building docker image"
	docker buildx build --platform linux/amd64 -t $(REPO)/$(UISERVER):$(TAG) -f Dockerfile .
	@echo "Finished building docker $(UISERVER):$(TAG)"

docker-push: 
	docker login $(REPO)
	docker push $(REPO)/$(UISERVER):$(TAG)
	@echo "Pushed docker image $(REPO)/$(UISERVER):$(TAG)"

clean:
	@echo "Cleaning uiserver files.."
	@rm -rf build/ node_modules/ yarn.lock package-lock.json
	@echo "Done cleaning uiserver files.."

.PHONY: all start clean docker-build docker-push
