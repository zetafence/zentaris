REPO := docker.io/zentaris
API_SERVER := apiserver
BUILD_DIR := build
API_SERVER_STATIC := $(BUILD_DIR)/$(API_SERVER)-static

# Tagged release
TAG := v1.0.0

all: $(API_SERVER)
static: $(API_SERVER_STATIC) $(SEC_SERVER_STATIC)

$(API_SERVER):
	@mkdir -p $(BUILD_DIR)
	@go build -v -o $(BUILD_DIR)/$@ ./cmd/server/$*
	@echo "Done $@"

$(API_SERVER_STATIC):
	@echo "Building apiserver static image"
	CGO_ENABLE=0 GOOS=linux GOARCH=amd64 go build \
		-a -ldflags='-w -s' \
		-o $(API_SERVER_STATIC) \
		./cmd/server/$*
	@chmod +x $(API_SERVER_STATIC)
	@echo "Finished building static image"

docker-build: $(API_SERVER_STATIC) $(SEC_SERVER_STATIC)
	@echo "Building docker image"
	docker buildx build --platform linux/amd64 -t $(REPO)/$(API_SERVER):$(TAG) -f Dockerfile .
	@echo "Finished building docker $(API_SERVER):$(TAG)"

docker-push: $(API_SERVER_STATIC)
	docker login $(REPO)
	docker push $(REPO)/$(API_SERVER):$(TAG)
	@echo "Pushed docker image $(REPO)/$(API_SERVER):$(TAG)"

tidy:
	@go mod tidy
	@echo "Finished tidy"

test:
	@echo "Clearing test cache"
	@go clean -testcache
	@echo "Starting go test"
	@go test -v ./...
	@echo "Finished go tests"

apps:
	@echo "Making apps..."
	@cd apps; go clean -testcache; go test -v ./...
	@echo "Finished apps"

clean:
	@rm -f $(BUILD_DIR)/$(API_SERVER) $(API_SERVER_STATIC)
	@echo "Cleaned all"

clobber:
	@rm -rf $(BUILD_DIR)
	@echo "Clobber $(BUILD_DIR)"

.PHONY: all apiserver lint static test tidy clean clobber docker-build docker-push
