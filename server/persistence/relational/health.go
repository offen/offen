package relational

func (r *relationalDatabase) CheckHealth() error {
	return r.ping()
}
