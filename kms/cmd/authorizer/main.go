package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"golang.org/x/crypto/bcrypt"
)

func buildAPIArn(methodArn string) string {
	arnChunks := strings.Split(methodArn, ":")
	awsRegion, awsAccountID := arnChunks[3], arnChunks[4]

	gatewayArnChunks := strings.Split(arnChunks[5], "/")
	restAPIID, stage := gatewayArnChunks[0], gatewayArnChunks[1]

	return fmt.Sprintf("arn:aws:execute-api:%s:%s:%s/%s/*/*", awsRegion, awsAccountID, restAPIID, stage)
}

func newResponse(apiArn string, allow bool) events.APIGatewayCustomAuthorizerResponse {
	effect := "Deny"
	if allow {
		effect = "Allow"
	}

	return events.APIGatewayCustomAuthorizerResponse{
		PrincipalID: "offen",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action: []string{"execute-api:Invoke"},
					Effect: effect,
					Resource: []string{
						apiArn,
					},
				},
			},
		},
	}
}

func handler(ctx context.Context, event events.APIGatewayCustomAuthorizerRequest) (events.APIGatewayCustomAuthorizerResponse, error) {
	apiArn := buildAPIArn(event.MethodArn)

	b, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(event.AuthorizationToken, "Basic "))
	if err != nil || len(b) == 0 {
		return newResponse(apiArn, false), err
	}

	credentials := strings.Split(string(b), ":")
	user, pass := credentials[0], credentials[1]
	if user != os.Getenv("BASIC_AUTH_USER") {
		return newResponse(apiArn, false), nil
	}

	b, err = base64.StdEncoding.DecodeString(os.Getenv("HASHED_BASIC_AUTH_PASSWORD"))
	if err != nil {
		return newResponse(apiArn, false), err
	}

	if err := bcrypt.CompareHashAndPassword(b, []byte(pass)); err != nil {
		return newResponse(apiArn, false), nil
	}

	return newResponse(apiArn, true), nil
}

func main() {
	lambda.Start(handler)
}
