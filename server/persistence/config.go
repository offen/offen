// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"encoding/base64"
	"fmt"
)

func (p *persistenceLayer) GetSigningSecret() ([]byte, error) {
	v, err := p.dal.FindConfigValue(FindConfigValueQueryByKey(ConfigValueSigningSecret))
	if err != nil {
		return nil, fmt.Errorf("persistence: error looking up signing secret: %w", err)
	}
	b, err := base64.StdEncoding.DecodeString(v.Value)
	if err != nil {
		return nil, fmt.Errorf("persistence: error decoding persisted secret: %w", err)
	}
	return b, nil
}
