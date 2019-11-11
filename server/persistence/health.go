package persistence

// CheckHealth returns an error when the database connection is not working.
func (p *persistenceLayer) CheckHealth() error {
	return p.dal.Ping()
}
