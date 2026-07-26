from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.template import Context

# Fix Django 4.2 compatibility with Python 3.14 test client context copying
def custom_copy(self):
    duplicate = Context()
    duplicate.dicts = self.dicts[:]
    return duplicate
Context.__copy__ = custom_copy

class APITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_swagger_resolves(self):
        # Swagger documentation should be accessible
        response = self.client.get(reverse('schema-swagger-ui'))
        self.assertEqual(response.status_code, 200)

    def test_unauthenticated_api_access(self):
        # API endpoints should be protected by default and return 403 Forbidden (since IsAuthenticated is default)
        response = self.client.get(reverse('usuario-list'))
        self.assertEqual(response.status_code, 403)
