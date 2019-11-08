package persistence

// CheckHealth returns an error when the database connection is not working.
func (r *relationalDatabase) CheckHealth() error {
	return r.db.Ping()
}
