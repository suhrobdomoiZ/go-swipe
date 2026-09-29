// Command gen-initdata generates a signed initData string for the MAX
// mini-app, matching the check performed by maxbot.ValidateInitData
// (HMAC-SHA256 over the sorted "key=value" params, keyed by
// HMAC-SHA256("WebAppData", botToken)).
//
// This is a local development/testing utility only: it is not exposed as
// an HTTP endpoint and is not part of the deployed server image. Use it to
// obtain a valid initData value for POST /auth/max while working on the
// frontend without going through the real MAX client.
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

const paramWebAppData = "WebAppData"

type userApp struct {
	ID           int64  `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	LanguageCode string `json:"language_code"`
	PhotoURL     string `json:"photo_url"`
}

func main() {
	token := flag.String("token", "", "MAX bot token (required)")
	userID := flag.Int64("user", 0, "MAX user id (required)")
	firstName := flag.String("first-name", "Test", "user first_name")
	lastName := flag.String("last-name", "", "user last_name")
	lang := flag.String("lang", "ru", "user language_code")
	photoURL := flag.String("photo-url", "", "user photo_url")
	queryID := flag.String("query-id", "gen-initdata", "query_id param")
	startParam := flag.String("start-param", "", "start_param param")
	authDate := flag.Int64("auth-date", time.Now().Unix(), "auth_date unix timestamp")
	flag.Parse()

	if *token == "" {
		log.Fatal("gen-initdata: -token is required")
	}
	if *userID == 0 {
		log.Fatal("gen-initdata: -user is required")
	}

	user, err := json.Marshal(userApp{
		ID:           *userID,
		FirstName:    *firstName,
		LastName:     *lastName,
		LanguageCode: *lang,
		PhotoURL:     *photoURL,
	})
	if err != nil {
		log.Fatalf("gen-initdata: marshal user: %v", err)
	}

	params := map[string]string{
		"user":      string(user),
		"query_id":  *queryID,
		"auth_date": strconv.FormatInt(*authDate, 10),
	}
	if *startParam != "" {
		params["start_param"] = *startParam
	}

	fmt.Println(sign(params, *token))
}

func sign(params map[string]string, botToken string) string {
	sortedParams := make([]string, 0, len(params))
	for key, value := range params {
		sortedParams = append(sortedParams, fmt.Sprintf("%s=%s", key, value))
	}
	sort.Strings(sortedParams)
	dataCheckString := strings.Join(sortedParams, "\n")

	mac1 := hmac.New(sha256.New, []byte(paramWebAppData))
	mac1.Write([]byte(botToken))

	mac := hmac.New(sha256.New, mac1.Sum(nil))
	mac.Write([]byte(dataCheckString))
	hash := hex.EncodeToString(mac.Sum(nil))

	values := url.Values{}
	for key, value := range params {
		values.Set(key, value)
	}
	values.Set("hash", hash)

	return values.Encode()
}
