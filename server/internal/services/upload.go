package services

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

const maxUploadSize = 5 << 20

var allowedUploadExtensions = map[string]string{
	"image/png":  ".png",
	"image/jpeg": ".jpg",
	"image/webp": ".webp",
}

type Upload struct {
	dir string
}

func NewUpload(dir string) *Upload {
	return &Upload{dir: dir}
}

func (s *Upload) Save(_ context.Context, header *multipart.FileHeader) (string, error) {
	if header.Size > maxUploadSize {
		return "", domain.NewBadRequest(domain.CodeBadRequest, "uploads.Save: file is larger than 5MB")
	}

	file, err := header.Open()
	if err != nil {
		return "", domain.NewInternalServerError(domain.CodeInternalServerError, "uploads.Save: open uploaded file", err)
	}
	defer file.Close()

	sniff := make([]byte, 512)
	n, err := io.ReadFull(file, sniff)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		return "", domain.NewInternalServerError(domain.CodeInternalServerError, "uploads.Save: read uploaded file", err)
	}
	sniff = sniff[:n]

	contentType := http.DetectContentType(sniff)
	ext, ok := allowedUploadExtensions[contentType]
	if !ok {
		return "", domain.NewBadRequest(domain.CodeBadRequest, "uploads.Save: file must be png, jpeg or webp")
	}

	if err := os.MkdirAll(s.dir, 0o755); err != nil {
		return "", domain.NewInternalServerError(domain.CodeInternalServerError, "uploads.Save: create uploads dir", err)
	}

	filename := uuid.NewString() + ext
	dst, err := os.Create(filepath.Join(s.dir, filename))
	if err != nil {
		return "", domain.NewInternalServerError(domain.CodeInternalServerError, "uploads.Save: create file", err)
	}
	defer dst.Close()

	written := int64(0)
	if len(sniff) > 0 {
		w, err := dst.Write(sniff)
		if err != nil {
			return "", domain.NewInternalServerError(domain.CodeInternalServerError, "uploads.Save: write file", err)
		}
		written += int64(w)
	}
	copied, err := io.Copy(dst, io.LimitReader(file, maxUploadSize-written+1))
	if err != nil {
		return "", domain.NewInternalServerError(domain.CodeInternalServerError, "uploads.Save: write file", err)
	}
	if written+copied > maxUploadSize {
		_ = os.Remove(filepath.Join(s.dir, filename))
		return "", domain.NewBadRequest(domain.CodeBadRequest, "uploads.Save: file is larger than 5MB")
	}

	return fmt.Sprintf("/uploads/%s", filename), nil
}
