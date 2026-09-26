package maxclient

import (
	"context"
	"fmt"

	maxbot "github.com/max-messenger/max-bot-api-client-go/v2"
	"github.com/suhrobdomoiZ/go-swipe/server/internal/domain"
)

type Client struct {
	api *maxbot.Api
}

func New(token string) (*Client, error) {
	api, err := maxbot.NewApi(token)
	if err != nil {
		return nil, fmt.Errorf("create max api client: %w", err)
	}
	return &Client{api: api}, nil
}

func (c *Client) Ping(ctx context.Context) error {
	info, err := c.api.Bots.GetMyInfo(ctx)
	if err != nil {
		return domain.NewInternalServerError(
			domain.CodeInternalServerError,
			"maxclient.Ping: failed to ping user",
			err,
		)
	}
	if info.UserID == 0 {
		return domain.NewNotFound(domain.CodeNotFound, "maxclient.Ping: empty answer /me")
	}

	return nil
}

func (c *Client) SendText(ctx context.Context, userID int64, text string) error {
	msg := maxbot.NewMessage().SetUser(userID).SetText(text)
	if _, err := c.api.Messages.Send(ctx, msg); err != nil {
		return domain.NewInternalServerError(
			domain.CodeInternalServerError,
			"maxclient.SendText: failed to send message",
			err,
		)
	}
	return nil
}
