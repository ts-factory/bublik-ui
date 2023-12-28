/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export const HTTP_CODE_TO_ERROR_MAP = new Map<number, string>([
	[400, 'Bad request'],
	[401, 'Unauthorized'],
	[403, 'Forbidden'],
	[404, 'Not found'],
	[405, 'Method not allowed'],
	[406, 'Not acceptable'],
	[407, 'Proxy authentication required'],
	[408, 'Request timeout'],
	[409, 'Conflict'],
	[410, 'Gone'],
	[411, 'Length required'],
	[412, 'Precondition failed'],
	[413, 'Payload too large'],
	[414, 'URI too long'],
	[415, 'Unsupported media type'],
	[416, 'Range not satisfiable'],
	[417, 'Expectation failed'],
	[418, "I'm a teapot"],
	[421, 'Misdirected request'],
	[422, 'Unprocessable entity'],
	[423, 'Locked'],
	[424, 'Failed dependency'],
	[425, 'Too early'],
	[426, 'Upgrade required'],
	[428, 'Precondition required'],
	[429, 'Too many requests'],
	[431, 'Request header fields too large'],
	[451, 'Unavailable for legal reasons'],
	[500, 'Internal server error'],
	[501, 'Not implemented'],
	[502, 'Bad gateway'],
	[503, 'Service unavailable'],
	[504, 'Gateway timeout'],
	[505, 'HTTP version not supported'],
	[506, 'Variant also negotiates'],
	[507, 'Insufficient storage'],
	[508, 'Loop detected'],
	[510, 'Not extended'],
	[511, 'Network authentication required']
]);

export const HTTP_CODE_DESCRIPTIONS = new Map<number, string>([
	[
		400,
		'The server cannot or will not process the request due to client error'
	],
	[
		401,
		'Authentication is required and has failed or has not yet been provided'
	],
	[403, 'The request was valid, but the server is refusing action'],
	[404, 'The requested resource could not be found'],
	[405, 'A request method is not supported for the requested resource'],
	[
		406,
		'The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request'
	],
	[407, 'The client must first authenticate itself with the proxy'],
	[408, 'The server timed out waiting for the request'],
	[409, 'Request could not be processed because of conflict in the request'],
	[
		410,
		'Resource requested is no longer available and will not be available again'
	],
	[
		411,
		'The request did not specify the length of its content, which is required by the requested resource'
	],
	[
		412,
		'The server does not meet one of the preconditions that the requester put on the request'
	],
	[413, 'The request is larger than the server is willing or able to process'],
	[414, 'The URI provided was too long for the server to process'],
	[
		415,
		'The request entity has a media type which the server or resource does not support'
	],
	[
		416,
		'The client has asked for a portion of the file, but the server cannot supply that portion'
	],
	[
		417,
		'The server cannot meet the requirements of the Expect request-header field'
	],
	[
		418,
		'This code was defined in 1998 as one of the traditional IETF April Fools’ jokes, in RFC 2324, Hyper Text Coffee Pot Control Protocol, and is not expected to be implemented by actual HTTP servers'
	],
	[
		421,
		'The request was directed at a server that is not able to produce a response'
	],
	[
		422,
		'The request was well-formed but was unable to be followed due to semantic errors'
	],
	[423, 'The resource that is being accessed is locked'],
	[424, 'The request failed due to failure of a previous request'],
	[
		425,
		'Indicates that the server is unwilling to risk processing a request that might be replayed'
	],
	[
		426,
		'The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol'
	],
	[428, 'The origin server requires the request to be conditional'],
	[429, 'The user has sent too many requests in a given amount of time'],
	[
		431,
		'The server is unwilling to process the request because either an individual header field, or all the header fields collectively, are too large'
	],
	[
		451,
		'A server operator has received a legal demand to deny access to a resource or to a set of resources that includes the requested resource'
	],
	[
		500,
		'Server error occurred, try to refresh the page or feel free to contact us if the problem persists'
	],
	[
		501,
		'The server either does not recognize the request method, or it lacks the ability to fulfill the request'
	],
	[
		502,
		'The server was acting as a gateway or proxy and received an invalid response from the upstream server'
	],
	[
		503,
		'The server is currently unavailable (because it is overloaded or down for maintenance)'
	],
	[
		504,
		'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server'
	],
	[
		505,
		'The server does not support the HTTP protocol version used in the request'
	],
	[
		506,
		'Transparent content negotiation for the request results in a circular reference'
	],
	[
		507,
		'The server is unable to store the representation needed to complete the request'
	],
	[508, 'The server detected an infinite loop while processing the request'],
	[
		510,
		'Further extensions to the request are required for the server to fulfill it'
	],
	[
		511,
		'The 511 status code indicates that the client needs to authenticate to gain network access'
	]
]);
